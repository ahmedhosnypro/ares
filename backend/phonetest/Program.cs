using System;
using PhoneNumbers;

var util = PhoneNumberUtil.GetInstance();
var nums = new[] { "+20 100 000 0001", "+20 100 000 0002", "+20100000099", "+201000000001", "+201000000002", "+201000000099", "+201001234567" };

foreach (var n in nums)
{
    try
    {
        var parsed = util.Parse(n, null);
        var valid = util.IsValidNumber(parsed);
        Console.WriteLine($"{n} -> {valid} (type: {util.GetNumberType(parsed)})");
    }
    catch (Exception e)
    {
        Console.WriteLine($"{n} -> ERROR: {e.Message}");
    }
}
