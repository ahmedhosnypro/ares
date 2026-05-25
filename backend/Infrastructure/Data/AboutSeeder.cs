using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Data;

public static class AboutSeeder
{
    private static readonly (Guid Id, int Order, string SectionType, string Title, string Content)[] Sections =
    [
        (
            Guid.Parse("b2000001-0000-0000-0000-000000000001"),
            1,
            "hero",
            "Driving Egypt Forward",
            "ARES is Egypt's premier car rental platform — connecting travelers, professionals, and families with quality vehicles across every governorate.\n\nWe believe getting from A to B should be effortless, transparent, and affordable. That's why we built a platform where every booking is backed by verified suppliers, fair pricing, and real-time support."
        ),
        (
            Guid.Parse("b2000001-0000-0000-0000-000000000002"),
            2,
            "story",
            "Our Story",
            "ARES was founded in Cairo with a simple observation: renting a car in Egypt was unnecessarily complicated. Hidden fees, unreliable vehicles, and zero accountability were the norm.\n\nWe set out to change that. Starting with a handful of trusted suppliers in Cairo and Alexandria, we built a platform that puts transparency first — verified vehicles, upfront pricing, and a booking experience that takes minutes, not hours.\n\nToday, ARES operates across Egypt's major cities and tourist destinations, serving thousands of customers every month."
        ),
        (
            Guid.Parse("b2000001-0000-0000-0000-000000000003"),
            3,
            "offer",
            "What We Offer",
            "Economy & Compact Cars: Fuel-efficient city cars perfect for daily commutes and short trips\nSUVs & Crossovers: Spacious, capable vehicles for family travel and road trips\nLuxury Vehicles: Premium cars for business travel and special occasions\nElectric Vehicles: Eco-friendly options for the environmentally conscious driver\nVans & Minivans: Group travel solutions for up to 9 passengers\nAirport Transfers: Seamless pickup and drop-off at all major Egyptian airports"
        ),
        (
            Guid.Parse("b2000001-0000-0000-0000-000000000004"),
            4,
            "stats",
            "ARES by the Numbers",
            "Vehicles Available: 500+\nCities Covered: 12\nVerified Suppliers: 80+\nHappy Customers: 15,000+\nBookings Completed: 40,000+\nYears of Operation: 3+"
        ),
        (
            Guid.Parse("b2000001-0000-0000-0000-000000000005"),
            5,
            "values",
            "Our Values",
            "Transparency: No hidden fees, no surprises — every price you see is the price you pay\nReliability: Every vehicle on our platform is inspected and verified before listing\nAccessibility: Available 24/7 across web and mobile, in Arabic and English\nSustainability: Growing our electric and hybrid fleet to reduce environmental impact\nCommunity: Supporting local suppliers and creating economic opportunities across Egypt\nInnovation: Continuously improving our platform based on real customer feedback"
        ),
        (
            Guid.Parse("b2000001-0000-0000-0000-000000000006"),
            6,
            "cta",
            "Ready to Hit the Road?",
            "Join thousands of satisfied customers who trust ARES for every journey. Browse our fleet, compare prices, and book your perfect vehicle in minutes.\n\nNo hidden fees. No hassle. Just drive."
        ),
    ];

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        if (await context.AboutSections.AnyAsync()) return;

        var sections = Sections.Select(s => new AboutSection
        {
            Id = s.Id,
            Title = s.Title,
            Content = s.Content.Trim(),
            Order = s.Order,
            SectionType = s.SectionType,
        });

        await context.AboutSections.AddRangeAsync(sections);
        await context.SaveChangesAsync();
    }
}
