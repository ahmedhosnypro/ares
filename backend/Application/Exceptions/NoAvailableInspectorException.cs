using System;

namespace Backend.Application.Exceptions
{
    public class NoAvailableInspectorException : Exception
    {
        public NoAvailableInspectorException(string message) : base(message)
        {
        }
    }
}
