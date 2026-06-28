using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using System.Linq.Expressions;

namespace Backend.Tests.TestUtilities;

public static class MockDbSetExtensions
{
    public static Mock<DbSet<T>> BuildMockDbSet<T>(this IQueryable<T> data) where T : class
    {
        var mockSet = new Mock<DbSet<T>>();

        mockSet.As<IQueryable<T>>().Setup(m => m.Provider).Returns(new TestAsyncQueryProvider<T>(data.Provider));
        mockSet.As<IQueryable<T>>().Setup(m => m.Expression).Returns(data.Expression);
        mockSet.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(data.ElementType);
        mockSet.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(data.GetEnumerator());

        return mockSet;
    }
}

internal class TestAsyncQueryProvider<TEntity> : IAsyncQueryProvider
{
    private readonly IQueryProvider _inner;

    internal TestAsyncQueryProvider(IQueryProvider inner)
    {
        _inner = inner;
    }

    public IQueryable CreateQuery(Expression expression)
    {
        return new TestAsyncEnumerable<TEntity>(expression);
    }

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
    {
        return new TestAsyncEnumerable<TElement>(expression);
    }

    public object? Execute(Expression expression)
    {
        return _inner.Execute(RemoveIncludeVisitor.Visit(expression));
    }

    public TResult Execute<TResult>(Expression expression)
    {
        return _inner.Execute<TResult>(RemoveIncludeVisitor.Visit(expression));
    }

    public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
    {
        var cleanedExpression = RemoveIncludeVisitor.Visit(expression);
        var expectedResultType = typeof(TResult).GetGenericArguments()[0];
        var executionResult = typeof(IQueryProvider)
            .GetMethod(
                name: nameof(IQueryProvider.Execute),
                genericParameterCount: 1,
                types: new[] { typeof(Expression) })
            ?.MakeGenericMethod(expectedResultType)
            .Invoke(this, new[] { cleanedExpression });

        var taskFromResultMethod = typeof(Task).GetMethod(nameof(Task.FromResult))
            ?.MakeGenericMethod(expectedResultType);

        if (taskFromResultMethod == null)
            throw new InvalidOperationException($"Could not find Task.FromResult method for type {expectedResultType}");

        var result = taskFromResultMethod.Invoke(null, new[] { executionResult });
        if (result == null)
            throw new InvalidOperationException($"Task.FromResult returned null for type {expectedResultType}");

        return (TResult)result;
    }
}

internal class RemoveIncludeVisitor : ExpressionVisitor
{
    private static readonly HashSet<string> _includeMethodNames =
    [
        "Include", "ThenInclude", "AsNoTracking", "AsNoTrackingWithIdentityResolution",
        "AsTracking", "IgnoreQueryFilters", "IgnoreAutoIncludes"
    ];

    public static Expression Visit(Expression expression)
    {
        return new RemoveIncludeVisitor().Visit(expression);
    }

    protected override Expression VisitMethodCall(MethodCallExpression node)
    {
        if (_includeMethodNames.Contains(node.Method.Name) &&
            node.Method.DeclaringType?.Namespace?.StartsWith("Microsoft.EntityFrameworkCore") == true)
        {
            return Visit(node.Arguments[0]);
        }

        return base.VisitMethodCall(node);
    }
}

internal class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
{
    public TestAsyncEnumerable(IEnumerable<T> enumerable)
        : base(enumerable)
    { }

    public TestAsyncEnumerable(Expression expression)
        : base(expression)
    { }

    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
    {
        return new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
    }

    IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);
}

internal class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> _inner;

    public TestAsyncEnumerator(IEnumerator<T> inner)
    {
        _inner = inner;
    }

    public ValueTask<bool> MoveNextAsync()
    {
        return ValueTask.FromResult(_inner.MoveNext());
    }

    public T Current => _inner.Current;

    public ValueTask DisposeAsync()
    {
        _inner.Dispose();
        return ValueTask.CompletedTask;
    }
}