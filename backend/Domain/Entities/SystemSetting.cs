using System;

namespace Backend.Domain.Entities;

public class SystemSetting : AuditableEntity
{
    public new Guid Id { get; set; }
    public string Key { get; set; } = null!;
    public string Value { get; set; } = null!;
}
