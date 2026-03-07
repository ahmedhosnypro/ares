using System;

namespace Backend.Domain.Entities.Enums
{
    public enum AuthMethod
    {
        Password,
        Social,
        Phone,
        Sso,
        Biometric
    }

    public enum TwoFactorMethod
    {
        Sms,
        Authenticator,
        Email
    }

    public enum LoginMethod
    {
        Password,
        Social,
        MagicLink,
        SmsOtp,
        Biometric,
        Sso
    }

    public enum PhoneVerificationPurpose
    {
        Registration,
        Login,
        Verification
    }

    public enum SocialProvider
    {
        Google,
        Facebook,
        Apple,
        Wechat
    }

    public enum VerificationLevel
    {
        Basic,
        Standard,
        Enhanced,
        Premium
    }
}
