using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;

var b = WebApplication.CreateBuilder(args);
// Sem connection string => banco em memória (prototipo). Com string do Supabase => Postgres.
var cs = b.Configuration.GetConnectionString("Supabase");
b.Services.AddDbContext<Db>(o => { if (string.IsNullOrWhiteSpace(cs)) o.UseInMemoryDatabase("autohistory"); else o.UseNpgsql(cs); });
b.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
var app = b.Build();
app.UseCors();
using (var s = app.Services.CreateScope())
{
    var db = s.ServiceProvider.GetRequiredService<Db>();
    if (db.Database.IsRelational())
    {
        // Supabase já tem tabelas internas, então EnsureCreated não cria as nossas.
        try { db.GetService<IRelationalDatabaseCreator>().CreateTables(); }
        catch (Npgsql.PostgresException e) when (e.SqlState == "42P07") { /* tabelas já existem */ }
        // Migração simples para bancos criados antes dos novos campos
        db.Database.ExecuteSqlRaw("""
            alter table "Invoices" add column if not exists "MechanicName" text not null default '';
            alter table "Invoices" add column if not exists "Stars" integer null;
            alter table "Invoices" add column if not exists "Review" text null;
            update "Invoices" set "MechanicName" = 'Rafael Lima' where "MechanicName" = '';
            """);
    }
    else db.Database.EnsureCreated();
    Seed(db);
}

static object V(Vehicle v) => new { v.Id, v.OwnerId, v.Brand, v.Model, v.Version, v.Year, v.Plate, v.Color, v.Fuel, v.Km, v.ShareCode, v.ShareActive, shared = new { invoices = v.ShareInvoices, diagnostics = v.ShareDiagnostics } };
static object I(Invoice i) => new { i.Id, i.Number, i.VehicleId, i.Workshop, i.Date, i.Due, i.Km, i.Discount, i.Total, i.Status, i.PaidAt, i.MechanicName, i.Stars, i.Review, Items = i.Items.Select(x => new { description = x.Description, qty = x.Qty, unit = x.Unit }) };
static IResult Bad(string m) => Results.BadRequest(new { message = m });

app.MapPost("/api/auth/login", async (Db db, LoginReq r) =>
    await db.Users.FirstOrDefaultAsync(x => x.Email == r.Email && x.Password == r.Password) is { } u
        ? Results.Ok(new { u.Id, u.Name, u.Email, u.Role, u.Workshop }) : Bad("E-mail ou senha inválidos. Contas demo usam a senha 123456."));

app.MapGet("/api/vehicles", async (Db db, string? ownerId) =>
    (await db.Vehicles.Where(v => ownerId == null || v.OwnerId == ownerId).ToListAsync()).Select(V));
app.MapGet("/api/vehicles/{id}", async (Db db, string id) => await db.Vehicles.FindAsync(id) is { } v ? Results.Ok(V(v)) : Results.NotFound());
app.MapPost("/api/vehicles", async (Db db, NewVehicle n) =>
{
    var v = new Vehicle { Id = "v" + Guid.NewGuid().ToString("N")[..8], OwnerId = n.OwnerId, Brand = n.Brand, Model = n.Model, Version = n.Version, Year = n.Year, Plate = n.Plate.ToUpper(), Color = n.Color, Fuel = n.Fuel, Km = n.Km,
        ShareCode = "AH-" + Guid.NewGuid().ToString("N")[..4].ToUpper() + "-" + Random.Shared.Next(10, 99) };
    db.Vehicles.Add(v); await db.SaveChangesAsync(); return Results.Ok(V(v));
});
app.MapDelete("/api/vehicles/{id}", async (Db db, string id) =>
{
    var v = await db.Vehicles.FindAsync(id); if (v is null) return Results.NotFound();
    db.Vehicles.Remove(v); await db.SaveChangesAsync(); return Results.NoContent();
});
app.MapPost("/api/vehicles/{id}/share/{key}", async (Db db, string id, string key) =>
{
    var v = await db.Vehicles.FindAsync(id); if (v is null) return Results.NotFound();
    if (key == "shareActive") v.ShareActive = !v.ShareActive; else if (key == "invoices") v.ShareInvoices = !v.ShareInvoices; else if (key == "diagnostics") v.ShareDiagnostics = !v.ShareDiagnostics; else return Bad("Chave inválida");
    await db.SaveChangesAsync(); return Results.Ok(V(v));
});

app.MapGet("/api/events", async (Db db, string? vehicleIds) =>
{
    var ids = vehicleIds?.Split(',', StringSplitOptions.RemoveEmptyEntries);
    return await db.Events.Where(e => ids == null || ids.Contains(e.VehicleId)).OrderBy(e => e.Date).ToListAsync();
});

// Consulta por placa + credencial exclusiva. Nunca expõe dados do proprietário.
app.MapPost("/api/consult", async (Db db, ConsultReq r) =>
{
    var plate = new string(r.Plate.Where(char.IsLetterOrDigit).ToArray()).ToUpper(); var code = r.Code.Trim().ToUpper();
    var v = await db.Vehicles.FirstOrDefaultAsync(x => x.Plate == plate && x.ShareCode == code && x.ShareActive);
    if (v is null) return Bad("Placa ou credencial inválida, ou compartilhamento revogado.");
    var events = await db.Events.Where(e => e.VehicleId == v.Id).OrderBy(e => e.Date).ToListAsync();
    var invoices = v.ShareInvoices ? (await db.Invoices.Include(i => i.Items).Where(i => i.VehicleId == v.Id).ToListAsync()).Select(I) : Enumerable.Empty<object>();
    var diags = v.ShareDiagnostics ? (await db.Diags.Where(d => d.VehicleId == v.Id).ToListAsync()).Select(d => new { d.Id, d.VehicleId, d.Date, d.Km, codes = new[] { new { code = d.Code, desc = d.Description } }, d.Notes, simulated = true }) : null;
    return Results.Ok(new { vehicle = new { v.Id, v.Brand, v.Model, v.Version, v.Year, v.Plate, v.Color, v.Fuel, v.Km }, events, invoices, diagnostics = diags ?? Enumerable.Empty<object>() });
});

app.MapGet("/api/invoices", async (Db db, string? ownerId) =>
{
    var q = db.Invoices.Include(i => i.Items).AsQueryable();
    if (ownerId != null) q = q.Where(i => db.Vehicles.Any(v => v.Id == i.VehicleId && v.OwnerId == ownerId));
    return (await q.OrderByDescending(i => i.Date).ToListAsync()).Select(I);
});
app.MapPost("/api/invoices", async (Db db, NewInvoice n) =>
{
    var v = await db.Vehicles.FindAsync(n.VehicleId); if (v is null) return Bad("Veículo não encontrado");
    if (string.IsNullOrWhiteSpace(n.MechanicName)) return Bad("Informe o mecânico responsável pelo serviço.");
    if (n.Items.Count == 0 || n.Items.Any(i => i.Qty <= 0 || i.Unit < 0)) return Bad("Itens inválidos");
    var last = await db.Events.Where(e => e.VehicleId == v.Id).Select(e => (int?)e.Km).MaxAsync() ?? 0;
    if (n.Km < last) return Bad($"Quilometragem ({n.Km}) menor que o último registro ({last}). Revise o valor.");
    var total = Math.Max(0, n.Items.Sum(i => i.Qty * i.Unit) - n.Discount); var id = "i" + Guid.NewGuid().ToString("N")[..8];
    db.Invoices.Add(new Invoice { Id = id, Number = n.Number, VehicleId = v.Id, Workshop = n.Workshop, MechanicName = n.MechanicName.Trim(), Date = n.Date, Due = n.Due, Km = n.Km, Discount = n.Discount, Total = total, Status = "pendente", Items = n.Items.Select(i => new Item { Description = i.Description, Qty = i.Qty, Unit = i.Unit }).ToList() });
    db.Events.Add(new HistoryEvent { Id = "e" + Guid.NewGuid().ToString("N")[..8], VehicleId = v.Id, Date = n.Date, Km = n.Km, Type = "reparo", Description = string.Join(", ", n.Items.Select(i => i.Description)), Workshop = n.Workshop, Value = total, InvoiceId = id, Author = n.MechanicName.Trim() });
    v.Km = Math.Max(v.Km, n.Km);
    await db.SaveChangesAsync(); return Results.Ok(new { id });
});
// Pagamento SIMULADO. Com provedor Pix real, a confirmação virá de webhook validado no servidor.
app.MapPost("/api/invoices/{id}/pay", async (Db db, string id) =>
{
    var i = await db.Invoices.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id); if (i is null) return Results.NotFound();
    i.Status = "pago"; i.PaidAt = DateTime.UtcNow.ToString("yyyy-MM-dd"); await db.SaveChangesAsync(); return Results.Ok(I(i));
});

app.MapGet("/api/users", async (Db db, string? role) =>
    (await db.Users.Where(u => role == null || u.Role == role).ToListAsync()).Select(u => new { u.Id, u.Name, u.Role }));

// Transferência de propriedade: revoga compartilhamento e registra evento no histórico.
app.MapPost("/api/vehicles/{id}/transfer", async (Db db, string id, TransferReq r) =>
{
    var v = await db.Vehicles.FindAsync(id); if (v is null) return Results.NotFound();
    if (v.OwnerId != r.FromId) return Bad("Somente o proprietário atual pode transferir o veículo.");
    var email = r.ToEmail.Trim().ToLower();
    var to = await db.Users.FirstOrDefaultAsync(u => u.Email == email && u.Role == "owner");
    if (to is null) return Bad("Nenhum proprietário encontrado com esse e-mail.");
    if (to.Id == v.OwnerId) return Bad("O veículo já pertence a essa conta.");
    v.OwnerId = to.Id; v.ShareActive = false; v.ShareInvoices = false; v.ShareDiagnostics = false;
    v.ShareCode = "AH-" + Guid.NewGuid().ToString("N")[..4].ToUpper() + "-" + Random.Shared.Next(10, 99);
    db.Events.Add(new HistoryEvent { Id = "e" + Guid.NewGuid().ToString("N")[..8], VehicleId = v.Id, Date = DateTime.UtcNow.ToString("yyyy-MM-dd"), Km = v.Km, Type = "transferencia", Description = "Transferência de propriedade", Workshop = "—", Value = 0, Author = "Sistema" });
    await db.SaveChangesAsync(); return Results.Ok(V(v));
});

app.MapPost("/api/invoices/{id}/rating", async (Db db, string id, RatingReq r) =>
{
    var i = await db.Invoices.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id); if (i is null) return Results.NotFound();
    var v = await db.Vehicles.FindAsync(i.VehicleId);
    if (v is null || v.OwnerId != r.OwnerId) return Bad("Somente o proprietário do veículo pode avaliar este serviço.");
    if (r.Stars < 1 || r.Stars > 5) return Bad("A nota deve ser de 1 a 5.");
    i.Stars = r.Stars; i.Review = string.IsNullOrWhiteSpace(r.Comment) ? null : r.Comment.Trim();
    await db.SaveChangesAsync(); return Results.Ok(I(i));
});
app.MapGet("/api/mechanics/ratings", async (Db db, string? workshop) =>
{
    var list = await db.Invoices.Where(i => workshop == null || i.Workshop == workshop).ToListAsync();
    return list.Where(i => i.MechanicName != "").GroupBy(i => i.MechanicName).Select(g => new
    { mechanic = g.Key, services = g.Count(), ratings = g.Count(i => i.Stars != null), average = g.Where(i => i.Stars != null).Select(i => (double)i.Stars!.Value).DefaultIfEmpty(0).Average() }).OrderBy(x => x.mechanic);
});

app.Run("http://localhost:5080");

static void Seed(Db db)
{
    SeedBase(db);
    if (!db.Users.Any(x => x.Id == "u4"))
    {
        db.Users.AddRange(new User { Id = "u4", Name = "Marina Costa", Email = "marina@demo.com", Password = "123456", Role = "owner" },
            new User { Id = "u5", Name = "Bruno Alves", Email = "bruno@demo.com", Password = "123456", Role = "owner" });
        db.SaveChanges();
    }
}
static void SeedBase(Db db)
{
    if (db.Users.Any()) return;
    db.Users.AddRange(new User { Id = "u1", Name = "Carlos Mendes", Email = "proprietario@demo.com", Password = "123456", Role = "owner" },
        new User { Id = "u2", Name = "Ana Souza", Email = "comprador@demo.com", Password = "123456", Role = "buyer" },
        new User { Id = "u3", Name = "Rafael Lima", Email = "oficina@demo.com", Password = "123456", Role = "mechanic", Workshop = "Oficina Torque Fino" });
    db.Vehicles.AddRange(new Vehicle { Id = "v1", OwnerId = "u1", Brand = "Honda", Model = "Civic", Version = "EXL 2.0", Year = 2019, Plate = "ABC1D23", Color = "Prata", Fuel = "Flex", Km = 68400, ShareCode = "AH-7K2M-91", ShareActive = true, ShareInvoices = true, ShareDiagnostics = true },
        new Vehicle { Id = "v2", OwnerId = "u1", Brand = "Fiat", Model = "Argo", Version = "Drive 1.3", Year = 2021, Plate = "QWE4R56", Color = "Branco", Fuel = "Flex", Km = 41200, ShareCode = "AH-3P8X-20" });
    const string w = "Oficina Torque Fino", a = "Rafael Lima";
    db.Events.AddRange(new HistoryEvent { Id = "e1", VehicleId = "v1", Date = "2024-02-10", Km = 52000, Type = "oleo", Description = "Troca de óleo e filtro", Workshop = w, Value = 380, InvoiceId = "i1", Author = a },
        new HistoryEvent { Id = "e2", VehicleId = "v1", Date = "2024-09-18", Km = 60100, Type = "revisao", Description = "Revisão de 60.000 km", Workshop = w, Value = 1290, InvoiceId = "i2", Author = a },
        new HistoryEvent { Id = "e3", VehicleId = "v1", Date = "2025-05-22", Km = 68400, Type = "peca", Description = "Pastilhas de freio dianteiras", Workshop = w, Value = 520, InvoiceId = "i3", Author = a });
    db.Invoices.AddRange(new Invoice { Id = "i1", Number = "000231", VehicleId = "v1", Workshop = w, Date = "2024-02-10", Due = "2024-02-10", Km = 52000, Total = 380, Status = "pago", PaidAt = "2024-02-10", MechanicName = a, Stars = 5, Review = "Atendimento rápido e explicou tudo.", Items = { new Item { Description = "Óleo 5W30 4L", Qty = 1, Unit = 280 }, new Item { Description = "Filtro de óleo", Qty = 1, Unit = 100 } } },
        new Invoice { Id = "i2", Number = "000298", VehicleId = "v1", Workshop = w, Date = "2024-09-18", Due = "2024-09-25", Km = 60100, Total = 1290, Status = "vencido", MechanicName = "Paulo Ramos", Items = { new Item { Description = "Revisão completa", Qty = 1, Unit = 1290 } } },
        new Invoice { Id = "i3", Number = "000355", VehicleId = "v1", Workshop = w, Date = "2025-05-22", Due = "2026-12-30", Km = 68400, Total = 520, Status = "pendente", MechanicName = a, Items = { new Item { Description = "Pastilhas de freio", Qty = 1, Unit = 520 } } });
    db.Diags.Add(new Diag { Id = "d1", VehicleId = "v1", Date = "2025-05-22", Km = 68400, Code = "P0420", Description = "Eficiência do catalisador abaixo do limite", Notes = "Dado de demonstração. Requer inspeção adicional." });
    db.SaveChanges();
}

record LoginReq(string Email, string Password);
record NewVehicle(string OwnerId, string Brand, string Model, string? Version, int Year, string Plate, string Color, string Fuel, int Km);
record ConsultReq(string Plate, string Code);
record ItemDto(string Description, int Qty, decimal Unit);
record NewInvoice(string VehicleId, string Number, string Workshop, string Date, string Due, int Km, decimal Discount, List<ItemDto> Items, string Author, string MechanicName);
record TransferReq(string FromId, string ToEmail);
record RatingReq(string OwnerId, int Stars, string? Comment);

class Db(DbContextOptions<Db> o) : DbContext(o)
{
    public DbSet<User> Users => Set<User>(); public DbSet<Vehicle> Vehicles => Set<Vehicle>(); public DbSet<HistoryEvent> Events => Set<HistoryEvent>();
    public DbSet<Invoice> Invoices => Set<Invoice>(); public DbSet<Diag> Diags => Set<Diag>();
}
class User { public string Id { get; set; } = ""; public string Name { get; set; } = ""; public string Email { get; set; } = ""; public string Password { get; set; } = ""; public string Role { get; set; } = ""; public string? Workshop { get; set; } }
class Vehicle { public string Id { get; set; } = ""; public string OwnerId { get; set; } = ""; public string Brand { get; set; } = ""; public string Model { get; set; } = ""; public string? Version { get; set; } public int Year { get; set; } public string Plate { get; set; } = ""; public string Color { get; set; } = ""; public string Fuel { get; set; } = ""; public int Km { get; set; } public string ShareCode { get; set; } = ""; public bool ShareActive { get; set; } public bool ShareInvoices { get; set; } public bool ShareDiagnostics { get; set; } }
class HistoryEvent { public string Id { get; set; } = ""; public string VehicleId { get; set; } = ""; public string Date { get; set; } = ""; public int Km { get; set; } public string Type { get; set; } = ""; public string Description { get; set; } = ""; public string Workshop { get; set; } = ""; public decimal Value { get; set; } public string? InvoiceId { get; set; } public string Author { get; set; } = ""; }
class Invoice { public string Id { get; set; } = ""; public string Number { get; set; } = ""; public string VehicleId { get; set; } = ""; public string Workshop { get; set; } = ""; public string Date { get; set; } = ""; public string Due { get; set; } = ""; public int Km { get; set; } public decimal Discount { get; set; } public decimal Total { get; set; } public string Status { get; set; } = ""; public string? PaidAt { get; set; } public string MechanicName { get; set; } = ""; public int? Stars { get; set; } public string? Review { get; set; } public List<Item> Items { get; set; } = new(); }
class Item { public int Id { get; set; } public string InvoiceId { get; set; } = ""; public string Description { get; set; } = ""; public int Qty { get; set; } public decimal Unit { get; set; } }
class Diag { public string Id { get; set; } = ""; public string VehicleId { get; set; } = ""; public string Date { get; set; } = ""; public int Km { get; set; } public string Code { get; set; } = ""; public string Description { get; set; } = ""; public string Notes { get; set; } = ""; }
