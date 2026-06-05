SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

BEGIN TRY
    BEGIN TRAN;

    -- 1. Cancel active bookings
    UPDATE Bookings 
    SET Status = 'Cancelled', CancelledAt = GETUTCDATE(), CancellationReason = N'System cancellation by user request'
    WHERE Status NOT IN ('Cancelled', 'Completed');

    -- 2. Identify Drivers and Inspectors
    SELECT UserId INTO #UsersToDelete 
    FROM AspNetUserRoles 
    WHERE RoleId IN (SELECT Id FROM AspNetRoles WHERE Name IN ('Driver', 'Inspector'));

    -- 3. Remove references in Bookings to avoid FK constraint errors when deleting
    UPDATE Bookings SET AssignedInspectorId = NULL WHERE AssignedInspectorId IN (SELECT UserId FROM #UsersToDelete);
    UPDATE Bookings SET DriverId = NULL WHERE DriverId IN (SELECT UserId FROM #UsersToDelete);
    
    -- AssignedDriverProfileId references driver_profiles
    UPDATE Bookings SET AssignedDriverProfileId = NULL 
    WHERE AssignedDriverProfileId IN (SELECT Id FROM driver_profiles WHERE UserId IN (SELECT UserId FROM #UsersToDelete));

    -- 4. Delete dependencies related to Driver profiles and requests
    SELECT Id AS ProfileId INTO #DriverProfilesToDelete FROM driver_profiles WHERE UserId IN (SELECT UserId FROM #UsersToDelete);

    DELETE FROM driver_request_responses WHERE DriverProfileId IN (SELECT ProfileId FROM #DriverProfilesToDelete);
    DELETE FROM driver_requests WHERE FulfilledByDriverProfileId IN (SELECT ProfileId FROM #DriverProfilesToDelete);
    DELETE FROM driver_reviews WHERE DriverProfileId IN (SELECT ProfileId FROM #DriverProfilesToDelete);
    DELETE FROM driver_work_areas WHERE DriverProfileId IN (SELECT ProfileId FROM #DriverProfilesToDelete);
    
    DELETE FROM driver_profiles WHERE UserId IN (SELECT UserId FROM #UsersToDelete);
    DELETE FROM Drivers WHERE UserId IN (SELECT UserId FROM #UsersToDelete);

    -- 5. Delete dependencies related to Inspections
    SELECT Id AS InspId INTO #InspectionsToDelete FROM VehicleInspections WHERE InspectorId IN (SELECT UserId FROM #UsersToDelete);
    
    DELETE FROM InspectionPhotos WHERE InspectionId IN (SELECT InspId FROM #InspectionsToDelete);
    DELETE FROM InspectionImages WHERE InspectionId IN (SELECT InspId FROM #InspectionsToDelete);
    DELETE FROM VehicleInspections WHERE InspectorId IN (SELECT UserId FROM #UsersToDelete);
    DELETE FROM Inspectors WHERE UserId IN (SELECT UserId FROM #UsersToDelete);

    -- 6. Delete other user dependencies
    DELETE FROM AspNetUserRoles WHERE UserId IN (SELECT UserId FROM #UsersToDelete);
    DELETE FROM AspNetUserClaims WHERE UserId IN (SELECT UserId FROM #UsersToDelete);
    DELETE FROM AspNetUserLogins WHERE UserId IN (SELECT UserId FROM #UsersToDelete);
    DELETE FROM AspNetUserTokens WHERE UserId IN (SELECT UserId FROM #UsersToDelete);
    DELETE FROM RefreshTokens WHERE UserId IN (SELECT UserId FROM #UsersToDelete);
    DELETE FROM Notifications WHERE UserId IN (SELECT UserId FROM #UsersToDelete);
    DELETE FROM UserAddresses WHERE UserId IN (SELECT UserId FROM #UsersToDelete);
    
    -- 7. Finally delete from AspNetUsers
    DELETE FROM AspNetUsers WHERE Id IN (SELECT UserId FROM #UsersToDelete);

    DROP TABLE #UsersToDelete;
    DROP TABLE #DriverProfilesToDelete;
    DROP TABLE #InspectionsToDelete;

    COMMIT TRAN;
    PRINT 'Successfully cancelled bookings and deleted drivers/inspectors.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;
    PRINT ERROR_MESSAGE();
END CATCH
