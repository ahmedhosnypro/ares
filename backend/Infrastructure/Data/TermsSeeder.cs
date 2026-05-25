using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Data;

public static class TermsSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        if (await context.TermsSections.AnyAsync()) return;

        var sections = new[]
        {
            new TermsSection
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000001"),
                Title = "Acceptance of Terms",
                Content = "By accessing or using the Ares Car Rental platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.",
                Order = 1
            },
            new TermsSection
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000002"),
                Title = "Eligibility",
                Content = "You must be at least 21 years of age and hold a valid driver's license to rent a vehicle through Ares. By using our platform, you represent and warrant that you meet these requirements.",
                Order = 2
            },
            new TermsSection
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000003"),
                Title = "Reservations and Payments",
                Content = "All reservations are subject to vehicle availability. Full payment is required at the time of booking. We accept major credit cards and debit cards. Prices are displayed in the selected currency and include applicable taxes.",
                Order = 3
            },
            new TermsSection
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000004"),
                Title = "Cancellation Policy",
                Content = "Cancellations made more than 48 hours before the rental start time are eligible for a full refund. Cancellations within 48 hours may be subject to a cancellation fee equal to one day's rental charge.",
                Order = 4
            },
            new TermsSection
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000005"),
                Title = "Vehicle Use",
                Content = "Vehicles must be used in accordance with local traffic laws. Off-road use, racing, or use under the influence of alcohol or drugs is strictly prohibited. The renter is responsible for all traffic violations incurred during the rental period.",
                Order = 5
            },
            new TermsSection
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000006"),
                Title = "Insurance and Liability",
                Content = "Basic insurance coverage is included with every rental. The renter assumes liability for damages not covered by the included insurance. Additional coverage options are available at checkout.",
                Order = 6
            },
            new TermsSection
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000007"),
                Title = "Privacy",
                Content = "Your use of the platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. We collect and process personal data as described in the Privacy Policy.",
                Order = 7
            },
            new TermsSection
            {
                Id = Guid.Parse("10000001-0000-0000-0000-000000000008"),
                Title = "Changes to Terms",
                Content = "Ares reserves the right to modify these Terms at any time. Continued use of the platform after changes are posted constitutes your acceptance of the revised Terms.",
                Order = 8
            },
        };

        await context.TermsSections.AddRangeAsync(sections);
        await context.SaveChangesAsync();
    }
}
