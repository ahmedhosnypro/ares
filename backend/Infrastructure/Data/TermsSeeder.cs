using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Data;

public static class TermsSeeder
{
    private static readonly (Guid Id, string Title, string Content, int Order, string TitleAr, string ContentAr)[] Sections =
    [
        (
            Guid.Parse("10000001-0000-0000-0000-000000000001"),
            "Acceptance of Terms",
            "By accessing or using the Ares Car Rental platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.",
            1,
            "قبول الشروط",
            "باستخدامك لمنصة أريس لتأجير السيارات أو الوصول إليها، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام خدماتنا."
        ),
        (
            Guid.Parse("10000001-0000-0000-0000-000000000002"),
            "Eligibility",
            "You must be at least 21 years of age and hold a valid driver's license to rent a vehicle through Ares. By using our platform, you represent and warrant that you meet these requirements.",
            2,
            "الأهلية",
            "يجب أن يكون عمرك 21 عاماً على الأقل وأن تحمل رخصة قيادة سارية لاستئجار مركبة عبر أريس. باستخدام منصتنا، فإنك تقر أنك تستوفي هذه المتطلبات."
        ),
        (
            Guid.Parse("10000001-0000-0000-0000-000000000003"),
            "Reservations and Payments",
            "All reservations are subject to vehicle availability. Full payment is required at the time of booking. We accept major credit cards and debit cards. Prices are displayed in the selected currency and include applicable taxes.",
            3,
            "الحجوزات والمدفوعات",
            "جميع الحجوزات تخضع لتوفر المركبات. يُطلب الدفع الكامل في وقت الحجز. نقبل بطاقات الائتمان والخصم الرئيسية. تُعرض الأسعار بالعملة المحددة وتشمل الضرائب المطبقة."
        ),
        (
            Guid.Parse("10000001-0000-0000-0000-000000000004"),
            "Cancellation Policy",
            "Cancellations made more than 48 hours before the rental start time are eligible for a full refund. Cancellations within 48 hours may be subject to a cancellation fee equal to one day's rental charge.",
            4,
            "سياسة الإلغاء",
            "الإلغاءات التي تتم قبل أكثر من 48 ساعة من وقت بدء الإيجار مؤهلة لاسترداد كامل المبلغ. الإلغاءات خلال 48 ساعة قد تخضع لرسوم إلغاء تساوي رسوم إيجار يوم واحد."
        ),
        (
            Guid.Parse("10000001-0000-0000-0000-000000000005"),
            "Vehicle Use",
            "Vehicles must be used in accordance with local traffic laws. Off-road use, racing, or use under the influence of alcohol or drugs is strictly prohibited. The renter is responsible for all traffic violations incurred during the rental period.",
            5,
            "استخدام المركبات",
            "يجب استخدام المركبات وفقاً لقوانين المرور المحلية. يُمنع منعاً باتاً الاستخدام خارج الطريق أو السباق أو القيادة تحت تأثير الكحول أو المخدرات. يتحمل المستأجر مسؤولية جميع مخالفات المرور التي تقع خلال فترة الإيجار."
        ),
        (
            Guid.Parse("10000001-0000-0000-0000-000000000006"),
            "Insurance and Liability",
            "Basic insurance coverage is included with every rental. The renter assumes liability for damages not covered by the included insurance. Additional coverage options are available at checkout.",
            6,
            "التأمين والمسؤولية",
            "يُتضمن تغطية تأمين أساسية مع كل إيجار. يتحمل المستأجر مسؤولية الأضرار غير المشمولة بالتأمين المضمن. تتوفر خيارات تغطية إضافية عند الدفع."
        ),
        (
            Guid.Parse("10000001-0000-0000-0000-000000000007"),
            "Privacy",
            "Your use of the platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. We collect and process personal data as described in the Privacy Policy.",
            7,
            "الخصوصية",
            "يخضع استخدامك للمنصة أيضاً لسياسة الخصوصية الخاصة بنا، والتي تم تضمينها في هذه الشروط بالرجوع إليها. نقوم بجمع ومعالجة البيانات الشخصية كما هو موضح في سياسة الخصوصية."
        ),
        (
            Guid.Parse("10000001-0000-0000-0000-000000000008"),
            "Changes to Terms",
            "Ares reserves the right to modify these Terms at any time. Continued use of the platform after changes are posted constitutes your acceptance of the revised Terms.",
            8,
            "تعديل الشروط",
            "تحتفظ أريس بالحق في تعديل هذه الشروط في أي وقت. الاستمرار في استخدام المنصة بعد نشر التعديلات يُعد قبولاً منك للشروط المعدلة."
        ),
    ];

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        if (await context.TermsSections.AnyAsync()) return;

        var sections = Sections.Select(s => new TermsSection
        {
            Id = s.Id,
            Title = s.Title,
            Content = s.Content,
            Order = s.Order,
            Localizations = new Dictionary<string, SectionLocalization>
            {
                ["en"] = new() { Title = s.Title, Content = s.Content },
                ["ar"] = new() { Title = s.TitleAr, Content = s.ContentAr },
            }
        });

        await context.TermsSections.AddRangeAsync(sections);
        await context.SaveChangesAsync();
    }
}
