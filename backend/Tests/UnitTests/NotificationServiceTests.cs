using Backend.Application.DTOs.Notification;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Domain.Entities;
using Moq;
using Xunit;

namespace Backend.Tests.UnitTests;

/// <summary>
/// Unit tests for NotificationService
/// Tests GetUserNotificationsAsync, MarkAsReadAsync, and CreateNotificationAsync methods
/// </summary>
public class NotificationServiceTests
{
    private readonly Mock<INotificationRepository> _notificationRepositoryMock;
    private readonly NotificationService _notificationService;

    public NotificationServiceTests()
    {
        _notificationRepositoryMock = new Mock<INotificationRepository>();
        _notificationService = new NotificationService(_notificationRepositoryMock.Object);
    }

    #region GetUserNotificationsAsync Tests

    [Fact]
    public async Task GetUserNotificationsAsync_WithValidUserId_ShouldReturnNotifications()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notifications = CreateTestNotifications(userId, 3);

        _notificationRepositoryMock.Setup(x => x.GetUserNotificationsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(notifications);

        // Act
        var result = await _notificationService.GetUserNotificationsAsync(userId);

        // Assert
        Assert.NotNull(result);
        var notificationList = result.ToList();
        Assert.Equal(3, notificationList.Count);

        // Verify first notification data
        var firstNotification = notificationList.First();
        Assert.Equal(userId, firstNotification.UserId);
        Assert.Equal("Test Title 0", firstNotification.Title);
        Assert.Equal("Test Message 0", firstNotification.Message);
        Assert.True(firstNotification.CreatedAt <= DateTime.UtcNow);

        _notificationRepositoryMock.Verify(x => x.GetUserNotificationsAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetUserNotificationsAsync_WithEmptyNotifications_ShouldReturnEmptyCollection()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var emptyNotifications = new List<Notification>();

        _notificationRepositoryMock.Setup(x => x.GetUserNotificationsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyNotifications);

        // Act
        var result = await _notificationService.GetUserNotificationsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);

        _notificationRepositoryMock.Verify(x => x.GetUserNotificationsAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetUserNotificationsAsync_WithMixedReadStatus_ShouldReturnAllNotifications()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            CreateTestNotification(userId, "Read Title", "Read Message", isRead: true),
            CreateTestNotification(userId, "Unread Title", "Unread Message", isRead: false)
        };

        _notificationRepositoryMock.Setup(x => x.GetUserNotificationsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(notifications);

        // Act
        var result = await _notificationService.GetUserNotificationsAsync(userId);

        // Assert
        Assert.NotNull(result);
        var notificationList = result.ToList();
        Assert.Equal(2, notificationList.Count);

        var readNotification = notificationList.First(n => n.Title == "Read Title");
        var unreadNotification = notificationList.First(n => n.Title == "Unread Title");

        Assert.True(readNotification.IsRead);
        Assert.False(unreadNotification.IsRead);

        _notificationRepositoryMock.Verify(x => x.GetUserNotificationsAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetUserNotificationsAsync_WithCancellationToken_ShouldPassTokenToRepository()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var cancellationToken = new CancellationToken();
        var notifications = CreateTestNotifications(userId, 1);

        _notificationRepositoryMock.Setup(x => x.GetUserNotificationsAsync(userId, cancellationToken))
            .ReturnsAsync(notifications);

        // Act
        await _notificationService.GetUserNotificationsAsync(userId, cancellationToken);

        // Assert
        _notificationRepositoryMock.Verify(x => x.GetUserNotificationsAsync(userId, cancellationToken), Times.Once);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(10)]
    [InlineData(50)]
    public async Task GetUserNotificationsAsync_WithVariousNotificationCounts_ShouldReturnCorrectCount(int count)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notifications = CreateTestNotifications(userId, count);

        _notificationRepositoryMock.Setup(x => x.GetUserNotificationsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(notifications);

        // Act
        var result = await _notificationService.GetUserNotificationsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(count, result.Count());
    }

    #endregion

    #region MarkAsReadAsync Tests

    [Fact]
    public async Task MarkAsReadAsync_WithValidNotificationId_ShouldCallRepository()
    {
        // Arrange
        var notificationId = Guid.NewGuid();

        _notificationRepositoryMock.Setup(x => x.MarkAsReadAsync(notificationId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _notificationService.MarkAsReadAsync(notificationId);

        // Assert
        _notificationRepositoryMock.Verify(x => x.MarkAsReadAsync(notificationId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MarkAsReadAsync_WithCancellationToken_ShouldPassTokenToRepository()
    {
        // Arrange
        var notificationId = Guid.NewGuid();
        var cancellationToken = new CancellationToken();

        _notificationRepositoryMock.Setup(x => x.MarkAsReadAsync(notificationId, cancellationToken))
            .Returns(Task.CompletedTask);

        // Act
        await _notificationService.MarkAsReadAsync(notificationId, cancellationToken);

        // Assert
        _notificationRepositoryMock.Verify(x => x.MarkAsReadAsync(notificationId, cancellationToken), Times.Once);
    }

    [Fact]
    public async Task MarkAsReadAsync_WithEmptyGuid_ShouldStillCallRepository()
    {
        // Arrange
        var notificationId = Guid.Empty;

        _notificationRepositoryMock.Setup(x => x.MarkAsReadAsync(notificationId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _notificationService.MarkAsReadAsync(notificationId);

        // Assert
        _notificationRepositoryMock.Verify(x => x.MarkAsReadAsync(notificationId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MarkAsReadAsync_WhenRepositoryThrowsException_ShouldPropagateException()
    {
        // Arrange
        var notificationId = Guid.NewGuid();
        var expectedException = new InvalidOperationException("Repository error");

        _notificationRepositoryMock.Setup(x => x.MarkAsReadAsync(notificationId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(expectedException);

        // Act & Assert
        var actualException = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _notificationService.MarkAsReadAsync(notificationId));

        Assert.Equal(expectedException.Message, actualException.Message);
        _notificationRepositoryMock.Verify(x => x.MarkAsReadAsync(notificationId, It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region CreateNotificationAsync Tests

    [Fact]
    public async Task CreateNotificationAsync_WithValidData_ShouldCreateNotification()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var title = "Test Title";
        var message = "Test Message";
        var createdNotification = CreateTestNotification(userId, title, message);

        _notificationRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdNotification);

        _notificationRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        await _notificationService.CreateNotificationAsync(userId, title, message);

        // Assert
        _notificationRepositoryMock.Verify(x => x.AddAsync(It.Is<Notification>(n =>
            n.UserId == userId &&
            n.Title == title &&
            n.Message == message &&
            n.IsRead == false &&
            n.CreatedAt <= DateTime.UtcNow), It.IsAny<CancellationToken>()), Times.Once);

        _notificationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateNotificationAsync_WithCancellationToken_ShouldPassTokenToRepository()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var title = "Test Title";
        var message = "Test Message";
        var cancellationToken = new CancellationToken();
        var createdNotification = CreateTestNotification(userId, title, message);

        _notificationRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Notification>(), cancellationToken))
            .ReturnsAsync(createdNotification);

        _notificationRepositoryMock.Setup(x => x.SaveChangesAsync(cancellationToken))
            .ReturnsAsync(1);

        // Act
        await _notificationService.CreateNotificationAsync(userId, title, message, cancellationToken);

        // Assert
        _notificationRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Notification>(), cancellationToken), Times.Once);
        _notificationRepositoryMock.Verify(x => x.SaveChangesAsync(cancellationToken), Times.Once);
    }

    [Theory]
    [InlineData("", "Valid Message")]
    [InlineData("Valid Title", "")]
    [InlineData("", "")]
    public async Task CreateNotificationAsync_WithEmptyStrings_ShouldStillCreateNotification(string title, string message)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var createdNotification = CreateTestNotification(userId, title, message);

        _notificationRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdNotification);

        _notificationRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        await _notificationService.CreateNotificationAsync(userId, title, message);

        // Assert
        _notificationRepositoryMock.Verify(x => x.AddAsync(It.Is<Notification>(n =>
            n.UserId == userId &&
            n.Title == title &&
            n.Message == message &&
            n.IsRead == false), It.IsAny<CancellationToken>()), Times.Once);

        _notificationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateNotificationAsync_WithEmptyUserId_ShouldStillCreateNotification()
    {
        // Arrange
        var userId = Guid.Empty;
        var title = "Test Title";
        var message = "Test Message";
        var createdNotification = CreateTestNotification(userId, title, message);

        _notificationRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdNotification);

        _notificationRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        await _notificationService.CreateNotificationAsync(userId, title, message);

        // Assert
        _notificationRepositoryMock.Verify(x => x.AddAsync(It.Is<Notification>(n =>
            n.UserId == userId &&
            n.Title == title &&
            n.Message == message), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateNotificationAsync_ShouldSetIsReadToFalse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var title = "Test Title";
        var message = "Test Message";
        var createdNotification = CreateTestNotification(userId, title, message);

        _notificationRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdNotification);

        _notificationRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        await _notificationService.CreateNotificationAsync(userId, title, message);

        // Assert
        _notificationRepositoryMock.Verify(x => x.AddAsync(It.Is<Notification>(n =>
            n.IsRead == false), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateNotificationAsync_ShouldSetCreatedAtToCurrentTime()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var title = "Test Title";
        var message = "Test Message";
        var beforeCreation = DateTime.UtcNow;
        var createdNotification = CreateTestNotification(userId, title, message);

        _notificationRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdNotification);

        _notificationRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        await _notificationService.CreateNotificationAsync(userId, title, message);
        var afterCreation = DateTime.UtcNow;

        // Assert
        _notificationRepositoryMock.Verify(x => x.AddAsync(It.Is<Notification>(n =>
            n.CreatedAt >= beforeCreation &&
            n.CreatedAt <= afterCreation), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateNotificationAsync_WhenAddAsyncFails_ShouldPropagateException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var title = "Test Title";
        var message = "Test Message";
        var expectedException = new InvalidOperationException("Add failed");

        _notificationRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(expectedException);

        // Act & Assert
        var actualException = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _notificationService.CreateNotificationAsync(userId, title, message));

        Assert.Equal(expectedException.Message, actualException.Message);
        _notificationRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Once);
        _notificationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateNotificationAsync_WhenSaveChangesFails_ShouldPropagateException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var title = "Test Title";
        var message = "Test Message";
        var createdNotification = CreateTestNotification(userId, title, message);
        var expectedException = new InvalidOperationException("Save failed");

        _notificationRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdNotification);

        _notificationRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(expectedException);

        // Act & Assert
        var actualException = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _notificationService.CreateNotificationAsync(userId, title, message));

        Assert.Equal(expectedException.Message, actualException.Message);
        _notificationRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Once);
        _notificationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("Booking Confirmation", "Your booking has been confirmed")]
    [InlineData("Payment Received", "Payment of $100 has been processed")]
    [InlineData("Booking Cancelled", "Your booking has been cancelled")]
    [InlineData("Vehicle Available", "Your requested vehicle is now available")]
    public async Task CreateNotificationAsync_WithVariousNotificationTypes_ShouldCreateCorrectly(string title, string message)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var createdNotification = CreateTestNotification(userId, title, message);

        _notificationRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdNotification);

        _notificationRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        await _notificationService.CreateNotificationAsync(userId, title, message);

        // Assert
        _notificationRepositoryMock.Verify(x => x.AddAsync(It.Is<Notification>(n =>
            n.UserId == userId &&
            n.Title == title &&
            n.Message == message &&
            n.IsRead == false), It.IsAny<CancellationToken>()), Times.Once);
    }

    #endregion

    #region DeleteNotificationForUserAsync Tests

    [Fact]
    public async Task DeleteNotificationForUserAsync_WithValidIdAndOwner_ShouldDeleteAndReturnTrue()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification { Id = notificationId, UserId = userId, Title = "Test Title" };

        _notificationRepositoryMock.Setup(x => x.GetByIdAsync(notificationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(notification);

        _notificationRepositoryMock.Setup(x => x.DeleteAsync(notification, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _notificationRepositoryMock.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _notificationService.DeleteNotificationForUserAsync(notificationId, userId);

        // Assert
        Assert.True(result);
        _notificationRepositoryMock.Verify(x => x.GetByIdAsync(notificationId, It.IsAny<CancellationToken>()), Times.Once);
        _notificationRepositoryMock.Verify(x => x.DeleteAsync(notification, It.IsAny<CancellationToken>()), Times.Once);
        _notificationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteNotificationForUserAsync_WithNonExistentId_ShouldReturnFalse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();

        _notificationRepositoryMock.Setup(x => x.GetByIdAsync(notificationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Notification?)null);

        // Act
        var result = await _notificationService.DeleteNotificationForUserAsync(notificationId, userId);

        // Assert
        Assert.False(result);
        _notificationRepositoryMock.Verify(x => x.GetByIdAsync(notificationId, It.IsAny<CancellationToken>()), Times.Once);
        _notificationRepositoryMock.Verify(x => x.DeleteAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Never);
        _notificationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteNotificationForUserAsync_WithWrongUserId_ShouldReturnFalse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var wrongUserId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification { Id = notificationId, UserId = userId, Title = "Test Title" };

        _notificationRepositoryMock.Setup(x => x.GetByIdAsync(notificationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(notification);

        // Act
        var result = await _notificationService.DeleteNotificationForUserAsync(notificationId, wrongUserId);

        // Assert
        Assert.False(result);
        _notificationRepositoryMock.Verify(x => x.GetByIdAsync(notificationId, It.IsAny<CancellationToken>()), Times.Once);
        _notificationRepositoryMock.Verify(x => x.DeleteAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Never);
        _notificationRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    #endregion

    #region Helper Methods

    private List<Notification> CreateTestNotifications(Guid userId, int count)
    {
        var notifications = new List<Notification>();
        for (int i = 0; i < count; i++)
        {
            notifications.Add(CreateTestNotification(userId, $"Test Title {i}", $"Test Message {i}", i % 2 == 0));
        }
        return notifications;
    }

    private Notification CreateTestNotification(Guid userId, string title, string message, bool isRead = false)
    {
        return new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Message = message,
            IsRead = isRead,
            CreatedAt = DateTime.UtcNow.AddMinutes(-Random.Shared.Next(1, 1440)) // Random time within last 24 hours
        };
    }

    #endregion
}