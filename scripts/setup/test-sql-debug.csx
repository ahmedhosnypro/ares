#r "nuget: Microsoft.Data.SqlClient, 5.2.0"
using Microsoft.Data.SqlClient;

try {
    using var conn = new SqlConnection(Args[0]);
    await conn.OpenAsync();
    
    var cmd = new SqlCommand("SELECT @@VERSION", conn);
    var version = await cmd.ExecuteScalarAsync();
    
    Console.WriteLine($"SUCCESS:{version?.ToString() ?? "Unknown"}");
} catch (Exception ex) {
    Console.WriteLine($"ERROR:{ex.Message}");
}
