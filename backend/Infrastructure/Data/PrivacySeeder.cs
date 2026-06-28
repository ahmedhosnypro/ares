using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Data;

public static class PrivacySeeder
{
    private static readonly (Guid Id, string Title, string Content, int Order, string TitleAr, string ContentAr)[] Sections =
    [
        (
            Guid.Parse("c0000001-0000-0000-0000-000000000001"),
            "Information We Collect",
            "We collect information you provide directly, such as your name, email address, phone number, driver's license details, and payment information when you use our platform. We also automatically collect certain information when you use our services, including your IP address, browser type, and device information.",
            1,
            "المعلومات التي نجمعها",
            "نجمع المعلومات التي تقدمها مباشرة، مثل اسمك وعنوان بريدك الإلكتروني ورقم هاتفك وتفاصيل رخصة القيادة ومعلومات الدفع عند استخدام منصتنا. نقوم أيضاً بجمع معلومات معينة تلقائياً عند استخدامك لخدماتنا، بما في ذلك عنوان IP الخاص بك ونوع المتصفح ومعلومات الجهاز."
        ),
        (
            Guid.Parse("c0000001-0000-0000-0000-000000000002"),
            "How We Use Your Information",
            "We use the information we collect to provide, maintain, and improve our services, process transactions, send you related information including confirmations and receipts, respond to your comments and questions, and provide customer service and technical support.",
            2,
            "كيف نستخدم معلوماتك",
            "نستخدم المعلومات التي نجمعها لتقديم خدماتنا وصيانتها وتحسينها ومعالجة المعاملات وإرسال المعلومات ذات الصلة بما في ذلك التأكيدات والإيصالات والرد على تعليقاتك وأسئلتك وتقديم خدمة العملاء والدعم الفني."
        ),
        (
            Guid.Parse("c0000001-0000-0000-0000-000000000003"),
            "Information Sharing",
            "We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except to trusted third parties who assist us in operating our platform, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.",
            3,
            "مشاركة المعلومات",
            "لا نبيع أو نتاجر أو ننقل معلوماتك الشخصية إلى أطراف خارجية باستثناء الأطراف الثالثة الموثوقة التي تساعدنا في تشغيل منصتنا وإدارة أعمالنا أو خدمتك، بشرط أن توافق تلك الأطراف على الحفاظ على سرية هذه المعلومات."
        ),
        (
            Guid.Parse("c0000001-0000-0000-0000-000000000004"),
            "Data Security",
            "We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by limited employees who have special access rights to such systems.",
            4,
            "أمن البيانات",
            "نطبق مجموعة متنوعة من تدابير الأمن للحفاظ على سلامة معلوماتك الشخصية. معلوماتك الشخصية محفوظة خلف شبكات مؤمّنة ولا يمكن الوصول إليها إلا من قبل موظفين محدودين لديهم حقوق وصول خاصة إلى هذه الأنظمة."
        ),
        (
            Guid.Parse("c0000001-0000-0000-0000-000000000005"),
            "Cookies",
            "We use cookies to understand and save your preferences for future visits, keep track of advertisements, and compile data about site traffic and site interaction so that we can offer better site experience and tools in the future.",
            5,
            "ملفات تعريف الارتباط",
            "نستخدم ملفات تعريف الارتباط لفهم تفضيلاتك وحفظها للزيارات المستقبلية وتتبع الإعلانات وتجميع البيانات حول حركة المرور والتفاعل مع الموقع حتى نتمكن من تقديم تجربة وأدوات أفضل في المستقبل."
        ),
        (
            Guid.Parse("c0000001-0000-0000-0000-000000000006"),
            "Your Rights",
            "You have the right to access, update, or delete your personal information at any time. You may also opt out of receiving promotional communications from us. To exercise these rights, please contact us through the information provided on our platform.",
            6,
            "حقوقك",
            "لديك الحق في الوصول إلى معلوماتك الشخصية أو تحديثها أو حذفها في أي وقت. يمكنك أيضاً إلغاء الاشتراك في تلقي الاتصالات الترويجية منا. لممارسة هذه الحقوق، يرجى الاتصال بنا من خلال المعلومات المقدمة على منصتنا."
        ),
        (
            Guid.Parse("c0000001-0000-0000-0000-000000000007"),
            "Changes to This Policy",
            "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the \"Last Updated\" date. You are advised to review this Privacy Policy periodically for any changes.",
            7,
            "التغييرات على هذه السياسة",
            "قد نقوم بتحديث سياسة الخصوصية الخاصة بنا من وقت لآخر. سنخطرك بأي تغييرات عن طريق نشر سياسة الخصوصية الجديدة على هذه الصفحة وتحديث تاريخ \"آخر تحديث\". يُنصح بمراجعة سياسة الخصوصية هذه بشكل دوري لاكتشاف أي تغييرات."
        ),
    ];

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        if (await context.PrivacySections.AnyAsync()) return;

        var sections = Sections.Select(s => new PrivacySection
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

        await context.PrivacySections.AddRangeAsync(sections);
        await context.SaveChangesAsync();
    }
}
