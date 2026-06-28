# CHAPTER 3: SYSTEM DESIGN & ARCHITECTURE

## 3.1 Introduction

This chapter presents the architectural design of the Ares Car Rental system, demonstrating the structural decisions made to fulfill the functional and non-functional requirements identified in Chapter 2. The design follows a layered architecture pattern, separating concerns into distinct components that interact through well-defined interfaces. This separation enhances maintainability, scalability, and testability while adhering to the SOLID principles.

The chapter is organized into several key sections: **System Context** (C4 Model), **Component/Layered Architecture**, **Database Schema** (ERD), **API Documentation**, **Technology Stack Justification**, **Architecture Decision Records (ADRs)**, **Key Algorithms and Workflows**, and **User Interface Design**. Each section provides a detailed view of the system from a specific perspective, ensuring architectural rigor and clarity.

Diagrams are presented using **Mermaid syntax**, following UML best practices and the university's guidelines for academic documentation. These diagrams serve as visual representations of the system's structure and interactions, complementing the textual descriptions.

---

## 3.2 System Context (C4 Model)

The **System Context** diagram provides a high-level overview of the Ares Car Rental system, illustrating its interactions with external actors and systems. This diagram is the first level of the C4 Model, focusing on the system as a single black box and its relationships with users and external services.

### Actors
1. **Guest**: An unauthenticated user who can browse vehicles, view public information, and initiate the registration process.
2. **Client**: An authenticated user with the role of `Customer`, `Supplier`, `Driver`, or `Inspector`. Clients can perform role-specific actions such as booking vehicles, managing listings, or inspecting vehicles.
3. **Admin**: A privileged user responsible for managing the system, including user verification, vehicle approval, and financial oversight.

### External Systems
1. **AWS SES**: Amazon Simple Email Service, used for sending transactional emails (e.g., booking confirmations, password resets).
2. **AWS S3**: Amazon Simple Storage Service, used for storing user-uploaded files (e.g., vehicle images, driver licenses).
3. **Payment Gateway**: A third-party payment processor (e.g., Paymob) responsible for handling credit card transactions and refunds.

### System Context Diagram
```mermaid
quadrantChart
  title Syntax Error Test
  x-axis Low Risk --> High
  y-axis Low Value --> High Value
  quadrant-1[Label]_BAD
  Critical: [1, 2]
```

**Figure 3.2**: System Context showing interaction with external services and actors.

### Interaction Description
1. **Guest**:
   - Browses available vehicles and public information (e.g., supplier details, promotions).
   - Registers or logs in to become a `Client`.

2. **Client**:
   - **Customer**: Books vehicles, submits reviews, and manages their profile.
   - **Supplier**: Lists vehicles, manages bookings, and uploads vehicle images.
   - **Driver**: Completes their profile, toggles availability, and views assigned bookings.
   - **Inspector**: Views assigned inspections, submits inspection reports, and uploads images.
   - Uploads documents (e.g., driver licenses) stored in **AWS S3**.
   - Receives transactional emails (e.g., booking confirmations) via **AWS SES**.

3. **Admin**:
   - Verifies user identities and driver licenses.
   - Approves or rejects vehicles listed by suppliers.
   - Manages bookings, payments, and system settings.
   - Monitors system health and generates reports.

4. **External Systems**:
   - **AWS SES**: Handles all outgoing emails (e.g., notifications, password resets).
   - **AWS S3**: Stores user-uploaded files (e.g., vehicle images, driver licenses).
   - **Payment Gateway**: Processes payments, refunds, and provides transaction status updates via webhooks.

---

## 3.3 Component / Layered Architecture

The Ares Car Rental system follows a **layered architecture**, organizing components into distinct layers based on their responsibilities. This separation of concerns ensures modularity, maintainability, and scalability. The layers are as follows:

1. **Presentation Layer (Frontend)**
   - **Technology**: Next.js (React-based framework)
   - **Responsibilities**:
     - Renders the user interface and handles user interactions.
     - Communicates with the backend via RESTful APIs.
     - Manages client-side state and routing.
     - Implements responsive design for mobile and desktop devices.

2. **Application Layer (Backend)**
   - **Technology**: .NET Core (C#)
   - **Responsibilities**:
     - Exposes RESTful APIs for the frontend to consume.
     - Implements business logic and workflows (e.g., booking checkout, payment processing).
     - Validates incoming requests and enforces authorization rules.
     - Interacts with the **Domain Layer** and **Infrastructure Layer** to fulfill requests.

3. **Domain Layer (Backend)**
   - **Technology**: .NET Core (C#)
   - **Responsibilities**:
     - Contains the core business entities (e.g., `User`, `Vehicle`, `Booking`).
     - Defines business rules and validation logic.
     - Implements domain services (e.g., `BookingService`, `PaymentService`).
     - Uses the **Repository Pattern** to abstract data access.

4. **Infrastructure Layer (Backend)**
   - **Technology**: .NET Core (C#), Entity Framework Core
   - **Responsibilities**:
     - Implements data access using **Entity Framework Core** (SQL Server).
     - Handles interactions with external systems (e.g., AWS SES, AWS S3, Payment Gateway).
     - Provides repositories for domain entities.
     - Manages database migrations and seeding.

5. **Database Layer**
   - **Technology**: SQL Server
   - **Responsibilities**:
     - Stores all persistent data (e.g., users, vehicles, bookings, payments).
     - Ensures data integrity through constraints (e.g., primary keys, foreign keys).
     - Supports complex queries for reporting and analytics.

### Layered Architecture Diagram
```mermaid
graph TD
    %% Layers
    Frontend[Presentation Layer\nNext.js\nHandles UI and user interactions]
    Backend_App[Application Layer\n.NET Core\nRESTful APIs, Business Logic]
    Backend_Domain[Domain Layer\n.NET Core\nEntities, Services, Business Rules]
    Backend_Infra[Infrastructure Layer\n.NET Core, EF Core\nData Access, External Systems]
    Database[Database Layer\nSQL Server\nPersistent Data Storage]

    %% External Systems
    AWS_SES[AWS SES\nEmail Service]
    AWS_S3[AWS S3\nFile Storage]
    Payment_Gateway[Payment Gateway\nTransaction Processing]

    %% Interactions
    Frontend -->|HTTP Requests| Backend_App
    Backend_App -->|Business Logic| Backend_Domain
    Backend_Domain -->|Data Access| Backend_Infra
    Backend_Infra -->|CRUD Operations| Database
    Backend_Infra -->|Send Emails| AWS_SES
    Backend_Infra -->|Store Files| AWS_S3
    Backend_Infra -->|Process Payments| Payment_Gateway
    Payment_Gateway -->|Webhooks| Backend_Infra
```

**Figure 3.3.a**: Layered architecture showing technology stack mapping.

### Key Components
1. **Frontend**:
   - **Next.js**: Enables server-side rendering (SSR) for improved SEO and performance.
   - **Material-UI (MUI)**: Provides a responsive and customizable UI component library.
   - **React Context**: Manages global state (e.g., authentication, theme).
   - **Axios**: Handles HTTP requests to the backend APIs.

2. **Backend**:
   - **Controllers**: Handle HTTP requests and delegate business logic to services (e.g., `BookingController`, `AuthController`).
   - **Services**: Implement business logic and workflows (e.g., `BookingService`, `PaymentService`).
   - **Repositories**: Abstract data access and interact with the database (e.g., `VehicleRepository`, `UserRepository`).
   - **Middleware**: Handles cross-cutting concerns (e.g., authentication, rate limiting, exception handling).
   - **DTOs (Data Transfer Objects)**: Define the shape of data exchanged between layers and with the frontend.

3. **Database**:
   - **SQL Server**: Chosen for its ACID compliance, scalability, and seamless integration with .NET Core.
   - **Entity Framework Core**: ORM used to map domain entities to database tables and execute queries.

---

## 3.4 Database Schema (ERD)

The **Entity-Relationship Diagram (ERD)** defines the structure of the database, including all entities, their attributes, and the relationships between them. The schema is designed to support the core functionalities of the Ares Car Rental system while ensuring data integrity and scalability.

### Entity-Relationship Diagram
```mermaid
erDiagram
    %% Entities
    User {
        Guid Id PK
        string Email
        string PasswordHash
        string FirstName
        string LastName
        string PhoneNumber
        string Role
        string Status
        bool EmailVerified
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    UserAddress {
        Guid Id PK
        Guid UserId FK
        string AddressLine1
        string AddressLine2
        string City
        string Governorate
        string Country
        string PostalCode
        double Latitude
        double Longitude
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    UserVerification {
        Guid Id PK
        Guid UserId FK
        string FrontImageUrl
        string BackImageUrl
        string Status
        string RejectionReason
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    DriverLicense {
        Guid Id PK
        Guid UserId FK
        string LicenseNumber
        DateTime ExpiryDate
        string FrontImageUrl
        string BackImageUrl
        string Status
        string RejectionReason
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    DriverProfile {
        Guid Id PK
        Guid UserId FK
        string LicenseNumber
        DateTime LicenseExpiryDate
        string ProfileImageUrl
        bool IsAvailable
        string Status
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    DriverPayoutInfo {
        Guid Id PK
        Guid DriverProfileId FK
        string WalletAddress
        string WalletType
        string Status
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    DriverEarning {
        Guid Id PK
        Guid DriverProfileId FK
        Guid BookingId FK
        decimal Amount
        string Status
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    DriverPayout {
        Guid Id PK
        Guid DriverProfileId FK
        decimal Amount
        string Status
        string TransactionReference
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    Supplier {
        Guid Id PK
        Guid UserId FK
        string BusinessName
        string BusinessEmail
        string BusinessPhone
        string TaxId
        string CommercialRegistrationNumber
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    Vehicle {
        Guid Id PK
        Guid CategoryId FK
        Guid UserId FK
        string Make
        string Model
        int Year
        string LicensePlate
        string Color
        int Seats
        string Transmission
        string FuelType
        decimal DailyRate
        decimal HourlyRate
        string Status
        string AvailabilityStatus
        bool IsActive
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    VehicleImage {
        Guid Id PK
        Guid VehicleId FK
        string ImageUrl
        bool IsPrimary
        DateTime CreatedAt
    }

    Category {
        Guid Id PK
        string Name
        string Description
        string Icon
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    CategoryOffer {
        Guid Id PK
        Guid CategoryId FK
        decimal DiscountPercentage
        DateTime StartDate
        DateTime EndDate
        bool IsActive
        DateTime CreatedAt
    }

    Booking {
        Guid Id PK
        Guid VehicleId FK
        Guid CustomerId FK
        Guid DriverId FK "nullable"
        Guid PickupLocationId FK
        Guid ReturnLocationId FK
        DateTime PickupDate
        DateTime ReturnDate
        string Status
        decimal TotalPrice
        string BookingNumber
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    BookingCheckoutState {
        Guid Id PK
        Guid BookingId FK
        string State
        Guid SelectedDriverId FK "nullable"
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    Payment {
        Guid Id PK
        Guid BookingId FK
        string TransactionId
        decimal Amount
        string Currency
        string Status
        string PaymentMethod
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    Review {
        Guid Id PK
        Guid VehicleId FK
        Guid BookingId FK
        Guid UserId FK
        int Rating
        string Comment
        string SupplierReply
        bool IsReported
        string ReportReason
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    DriverReview {
        Guid Id PK
        Guid BookingId FK
        Guid DriverProfileId FK
        Guid UserId FK
        int Rating
        string Comment
        DateTime CreatedAt
    }

    Notification {
        Guid Id PK
        Guid UserId FK
        string Title
        string Message
        string Type
        bool IsRead
        DateTime CreatedAt
    }

    Inspection {
        Guid Id PK
        Guid BookingId FK
        Guid InspectorId FK
        string Status
        string Notes
        int OdometerReading
        string FuelLevel
        string VehicleCondition
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    InspectionImage {
        Guid Id PK
        Guid InspectionId FK
        string ImageUrl
        DateTime CreatedAt
    }

    SystemSetting {
        Guid Id PK
        string Key
        string Value
        DateTime CreatedAt
        DateTime UpdatedAt
    }

    %% Relationships
    User ||--o{ UserAddress : "has"
    User ||--o{ UserVerification : "submits"
    User ||--o{ DriverLicense : "submits"
    User ||--|| DriverProfile : "has"
    DriverProfile ||--|| DriverPayoutInfo : "has"
    DriverProfile ||--o{ DriverEarning : "earns"
    DriverProfile ||--o{ DriverPayout : "receives"
    User ||--|| Supplier : "has"
    Supplier ||--o{ Vehicle : "owns"
    Vehicle ||--o{ VehicleImage : "has"
    Category ||--o{ CategoryOffer : "has"
    Category ||--o{ Vehicle : "contains"
    Vehicle ||--o{ Booking : "booked in"
    User ||--o{ Booking : "books as customer"
    DriverProfile ||--o{ Booking : "assigned to"
    Booking ||--|| BookingCheckoutState : "has"
    Booking ||--|| Payment : "has"
    Booking ||--o{ Review : "has"
    Booking ||--o{ DriverReview : "has"
    User ||--o{ Review : "writes"
    User ||--o{ Notification : "receives"
    Booking ||--|| Inspection : "has"
    User ||--o{ Inspection : "inspects as inspector"
    Inspection ||--o{ InspectionImage : "has"
```

**Figure 3.4**: Entity-Relationship Diagram showing all entities and relationships.

### Entity Descriptions
Below is a detailed description of each entity, including its fields, data types, constraints, and sample data.

#### 1. User
- **Description**: Represents a registered user in the system. Users can have different roles (e.g., `Customer`, `Supplier`, `Driver`, `Inspector`, `Admin`).
- **Fields**:
  | Field            | Data Type | Constraints                     | Description                                                                 |
  |------------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id               | Guid      | PK                              | Unique identifier for the user.                                             |
  | Email            | string    | Not null, Unique                | User's email address, used for authentication.                              |
  | PasswordHash     | string    | Not null                        | Hashed password for secure authentication.                                  |
  | FirstName        | string    | Not null                        | User's first name.                                                          |
  | LastName         | string    | Not null                        | User's last name.                                                           |
  | PhoneNumber      | string    |                                 | User's phone number.                                                        |
  | Role             | string    | Not null                        | User's role (e.g., `Customer`, `Supplier`, `Driver`, `Inspector`, `Admin`). |
  | Status           | string    | Not null, Default: `Active`     | User's account status (e.g., `Active`, `Blocked`, `Suspended`).            |
  | EmailVerified    | bool      | Default: `false`                | Indicates whether the user's email has been verified.                       |
  | CreatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of user creation.                                                 |
  | UpdatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174000",
    "Email": "john.doe@example.com",
    "FirstName": "John",
    "LastName": "Doe",
    "PhoneNumber": "+1234567890",
    "Role": "Customer",
    "Status": "Active",
    "EmailVerified": true,
    "CreatedAt": "2023-10-01T12:00:00Z",
    "UpdatedAt": "2023-10-01T12:00:00Z"
  }
  ```

#### 2. UserAddress
- **Description**: Stores the address information for a user. Users can have multiple addresses (e.g., home, work).
- **Fields**:
  | Field         | Data Type | Constraints                     | Description                                                                 |
  |---------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id            | Guid      | PK                              | Unique identifier for the address.                                          |
  | UserId        | Guid      | FK (User.Id), Not null          | Reference to the user who owns this address.                                |
  | AddressLine1  | string    | Not null                        | First line of the address.                                                  |
  | AddressLine2  | string    |                                 | Second line of the address (optional).                                      |
  | City          | string    | Not null                        | City of the address.                                                        |
  | Governorate   | string    |                                 | Governorate or state of the address.                                        |
  | Country       | string    | Not null                        | Country of the address.                                                     |
  | PostalCode    | string    |                                 | Postal code of the address.                                                 |
  | Latitude      | double    |                                 | Latitude coordinate for geolocation.                                        |
  | Longitude     | double    |                                 | Longitude coordinate for geolocation.                                       |
  | CreatedAt     | DateTime  | Not null, Default: `UTC Now`    | Timestamp of address creation.                                              |
  | UpdatedAt     | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174001",
    "UserId": "123e4567-e89b-12d3-a456-426614174000",
    "AddressLine1": "123 Main St",
    "AddressLine2": "Apt 4B",
    "City": "Cairo",
    "Governorate": "Cairo",
    "Country": "Egypt",
    "PostalCode": "11511",
    "Latitude": 30.0444,
    "Longitude": 31.2357,
    "CreatedAt": "2023-10-01T12:00:00Z",
    "UpdatedAt": "2023-10-01T12:00:00Z"
  }
  ```

#### 3. UserVerification
- **Description**: Stores identity verification documents submitted by users for admin review.
- **Fields**:
  | Field            | Data Type | Constraints                     | Description                                                                 |
  |------------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id               | Guid      | PK                              | Unique identifier for the verification record.                              |
  | UserId           | Guid      | FK (User.Id), Not null          | Reference to the user who submitted the verification.                       |
  | FrontImageUrl    | string    | Not null                        | URL of the front-side image of the identity document.                       |
  | BackImageUrl     | string    | Not null                        | URL of the back-side image of the identity document.                        |
  | Status           | string    | Not null, Default: `Pending`    | Verification status (e.g., `Pending`, `Approved`, `Rejected`).              |
  | RejectionReason  | string    |                                 | Reason for rejection (if status is `Rejected`).                             |
  | CreatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of verification submission.                                       |
  | UpdatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174002",
    "UserId": "123e4567-e89b-12d3-a456-426614174000",
    "FrontImageUrl": "https://ares-car-rental.s3.amazonaws.com/verifications/front.jpg",
    "BackImageUrl": "https://ares-car-rental.s3.amazonaws.com/verifications/back.jpg",
    "Status": "Approved",
    "CreatedAt": "2023-10-02T09:00:00Z",
    "UpdatedAt": "2023-10-02T10:00:00Z"
  }
  ```

#### 4. DriverLicense
- **Description**: Stores driver license information submitted by users for verification.
- **Fields**:
  | Field            | Data Type | Constraints                     | Description                                                                 |
  |------------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id               | Guid      | PK                              | Unique identifier for the driver license record.                            |
  | UserId           | Guid      | FK (User.Id), Not null          | Reference to the user who submitted the driver license.                     |
  | LicenseNumber    | string    | Not null                        | Driver license number.                                                      |
  | ExpiryDate       | DateTime  | Not null                        | Expiry date of the driver license.                                          |
  | FrontImageUrl    | string    | Not null                        | URL of the front-side image of the driver license.                          |
  | BackImageUrl     | string    |                                 | URL of the back-side image of the driver license (optional).                |
  | Status           | string    | Not null, Default: `Pending`    | Verification status (e.g., `Pending`, `Approved`, `Rejected`).              |
  | RejectionReason  | string    |                                 | Reason for rejection (if status is `Rejected`).                             |
  | CreatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of driver license submission.                                     |
  | UpdatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174003",
    "UserId": "123e4567-e89b-12d3-a456-426614174000",
    "LicenseNumber": "DL12345678",
    "ExpiryDate": "2025-12-31T00:00:00Z",
    "FrontImageUrl": "https://ares-car-rental.s3.amazonaws.com/driver-licenses/front.jpg",
    "BackImageUrl": "https://ares-car-rental.s3.amazonaws.com/driver-licenses/back.jpg",
    "Status": "Approved",
    "CreatedAt": "2023-10-02T09:00:00Z",
    "UpdatedAt": "2023-10-02T10:00:00Z"
  }
  ```

#### 5. DriverProfile
- **Description**: Stores additional profile information for users with the `Driver` role.
- **Fields**:
  | Field            | Data Type | Constraints                     | Description                                                                 |
  |------------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id               | Guid      | PK                              | Unique identifier for the driver profile.                                   |
  | UserId           | Guid      | FK (User.Id), Not null, Unique  | Reference to the user who owns this profile.                                |
  | LicenseNumber    | string    | Not null                        | Driver license number (copied from `DriverLicense` upon approval).         |
  | LicenseExpiryDate| DateTime  | Not null                        | Expiry date of the driver license (copied from `DriverLicense`).            |
  | ProfileImageUrl  | string    |                                 | URL of the driver's profile image.                                          |
  | IsAvailable      | bool      | Default: `false`                | Indicates whether the driver is available for assignments.                  |
  | Status           | string    | Not null, Default: `Pending`    | Profile status (e.g., `Pending`, `Approved`, `Rejected`).                   |
  | CreatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of profile creation.                                              |
  | UpdatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174004",
    "UserId": "123e4567-e89b-12d3-a456-426614174000",
    "LicenseNumber": "DL12345678",
    "LicenseExpiryDate": "2025-12-31T00:00:00Z",
    "ProfileImageUrl": "https://ares-car-rental.s3.amazonaws.com/profiles/driver.jpg",
    "IsAvailable": true,
    "Status": "Approved",
    "CreatedAt": "2023-10-02T09:00:00Z",
    "UpdatedAt": "2023-10-02T10:00:00Z"
  }
  ```

#### 6. DriverPayoutInfo
- **Description**: Stores payout information for drivers, including wallet addresses for earnings distribution.
- **Fields**:
  | Field         | Data Type | Constraints                     | Description                                                                 |
  |---------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id            | Guid      | PK                              | Unique identifier for the payout info record.                               |
  | DriverProfileId| Guid     | FK (DriverProfile.Id), Not null | Reference to the driver profile.                                            |
  | WalletAddress | string    | Not null                        | Wallet address for receiving payouts.                                       |
  | WalletType    | string    | Not null                        | Type of wallet (e.g., `Bank`, `PayPal`, `Crypto`).                          |
  | Status        | string    | Not null, Default: `Pending`    | Verification status (e.g., `Pending`, `Verified`, `Rejected`).              |
  | CreatedAt     | DateTime  | Not null, Default: `UTC Now`    | Timestamp of payout info creation.                                          |
  | UpdatedAt     | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174005",
    "DriverProfileId": "123e4567-e89b-12d3-a456-426614174004",
    "WalletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "WalletType": "Crypto",
    "Status": "Verified",
    "CreatedAt": "2023-10-03T11:00:00Z",
    "UpdatedAt": "2023-10-03T11:00:00Z"
  }
  ```

#### 7. DriverEarning
- **Description**: Tracks earnings generated by drivers from completed bookings.
- **Fields**:
  | Field         | Data Type | Constraints                     | Description                                                                 |
  |---------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id            | Guid      | PK                              | Unique identifier for the earning record.                                   |
  | DriverProfileId| Guid     | FK (DriverProfile.Id), Not null | Reference to the driver profile.                                            |
  | BookingId     | Guid      | FK (Booking.Id), Not null       | Reference to the booking that generated the earning.                        |
  | Amount        | decimal   | Not null                        | Earning amount (calculated as a percentage of the booking total).           |
  | Status        | string    | Not null, Default: `Pending`    | Payout status (e.g., `Pending`, `Paid`, `Failed`).                          |
  | CreatedAt     | DateTime  | Not null, Default: `UTC Now`    | Timestamp of earning creation.                                              |
  | UpdatedAt     | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174006",
    "DriverProfileId": "123e4567-e89b-12d3-a456-426614174004",
    "BookingId": "123e4567-e89b-12d3-a456-426614174010",
    "Amount": 50.00,
    "Status": "Paid",
    "CreatedAt": "2023-10-10T12:00:00Z",
    "UpdatedAt": "2023-10-10T12:00:00Z"
  }
  ```

#### 8. DriverPayout
- **Description**: Records payouts made to drivers for their earnings.
- **Fields**:
  | Field              | Data Type | Constraints                     | Description                                                                 |
  |--------------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id                 | Guid      | PK                              | Unique identifier for the payout record.                                    |
  | DriverProfileId    | Guid      | FK (DriverProfile.Id), Not null | Reference to the driver profile.                                            |
  | Amount             | decimal   | Not null                        | Payout amount.                                                              |
  | Status             | string    | Not null, Default: `Pending`    | Payout status (e.g., `Pending`, `Paid`, `Failed`, `Rejected`).              |
  | TransactionReference| string   |                                 | Reference ID from the payment processor (e.g., PayPal transaction ID).      |
  | CreatedAt          | DateTime  | Not null, Default: `UTC Now`    | Timestamp of payout creation.                                               |
  | UpdatedAt          | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174007",
    "DriverProfileId": "123e4567-e89b-12d3-a456-426614174004",
    "Amount": 200.00,
    "Status": "Paid",
    "TransactionReference": "PAY-1234567890",
    "CreatedAt": "2023-10-15T09:00:00Z",
    "UpdatedAt": "2023-10-15T09:30:00Z"
  }
  ```

#### 9. Supplier
- **Description**: Stores additional information for users with the `Supplier` role.
- **Fields**:
  | Field                        | Data Type | Constraints                     | Description                                                                 |
  |------------------------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id                           | Guid      | PK                              | Unique identifier for the supplier record.                                  |
  | UserId                       | Guid      | FK (User.Id), Not null, Unique  | Reference to the user who owns this supplier profile.                       |
  | BusinessName                 | string    | Not null                        | Name of the supplier's business.                                            |
  | BusinessEmail                | string    | Not null                        | Business email address.                                                     |
  | BusinessPhone                | string    | Not null                        | Business phone number.                                                      |
  | TaxId                        | string    |                                 | Tax identification number.                                                  |
  | CommercialRegistrationNumber | string    |                                 | Commercial registration number.                                              |
  | CreatedAt                    | DateTime  | Not null, Default: `UTC Now`    | Timestamp of supplier creation.                                             |
  | UpdatedAt                    | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174008",
    "UserId": "123e4567-e89b-12d3-a456-426614174009",
    "BusinessName": "Elite Cars",
    "BusinessEmail": "contact@elitecars.com",
    "BusinessPhone": "+201234567890",
    "TaxId": "TAX123456789",
    "CommercialRegistrationNumber": "CR123456",
    "CreatedAt": "2023-10-01T12:00:00Z",
    "UpdatedAt": "2023-10-01T12:00:00Z"
  }
  ```

#### 10. Vehicle
- **Description**: Represents a vehicle available for rental in the system.
- **Fields**:
  | Field               | Data Type | Constraints                     | Description                                                                 |
  |---------------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id                  | Guid      | PK                              | Unique identifier for the vehicle.                                          |
  | CategoryId          | Guid      | FK (Category.Id), Not null      | Reference to the vehicle category.                                          |
  | UserId              | Guid      | FK (User.Id), Not null          | Reference to the supplier who owns the vehicle.                             |
  | Make                | string    | Not null                        | Manufacturer of the vehicle (e.g., `Toyota`, `Honda`).                      |
  | Model               | string    | Not null                        | Model of the vehicle (e.g., `Camry`, `Civic`).                              |
  | Year                | int       | Not null                        | Manufacturing year of the vehicle.                                          |
  | LicensePlate        | string    | Not null                        | License plate number of the vehicle.                                        |
  | Color               | string    | Not null                        | Color of the vehicle.                                                       |
  | Seats               | int       | Not null                        | Number of seats in the vehicle.                                             |
  | Transmission        | string    | Not null                        | Transmission type (e.g., `Automatic`, `Manual`).                            |
  | FuelType            | string    | Not null                        | Fuel type (e.g., `Petrol`, `Diesel`, `Electric`).                           |
  | DailyRate           | decimal   | Not null                        | Daily rental rate for the vehicle.                                          |
  | HourlyRate          | decimal   |                                 | Hourly rental rate for the vehicle (optional).                              |
  | Status              | string    | Not null, Default: `Pending`    | Admin approval status (e.g., `Pending`, `Approved`, `Rejected`).            |
  | AvailabilityStatus  | string    | Not null, Default: `Unavailable`| Availability status (e.g., `Available`, `Unavailable`).                     |
  | IsActive            | bool      | Default: `true`                 | Indicates whether the vehicle is active in the system.                      |
  | CreatedAt           | DateTime  | Not null, Default: `UTC Now`    | Timestamp of vehicle creation.                                              |
  | UpdatedAt           | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174010",
    "CategoryId": "123e4567-e89b-12d3-a456-426614174011",
    "UserId": "123e4567-e89b-12d3-a456-426614174009",
    "Make": "Toyota",
    "Model": "Camry",
    "Year": 2022,
    "LicensePlate": "ABC123",
    "Color": "White",
    "Seats": 5,
    "Transmission": "Automatic",
    "FuelType": "Petrol",
    "DailyRate": 100.00,
    "HourlyRate": 20.00,
    "Status": "Approved",
    "AvailabilityStatus": "Available",
    "IsActive": true,
    "CreatedAt": "2023-10-01T12:00:00Z",
    "UpdatedAt": "2023-10-01T12:00:00Z"
  }
  ```

#### 11. VehicleImage
- **Description**: Stores images associated with a vehicle.
- **Fields**:
  | Field      | Data Type | Constraints                     | Description                                                                 |
  |------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id         | Guid      | PK                              | Unique identifier for the vehicle image.                                    |
  | VehicleId  | Guid      | FK (Vehicle.Id), Not null       | Reference to the vehicle.                                                   |
  | ImageUrl   | string    | Not null                        | URL of the image stored in AWS S3.                                          |
  | IsPrimary  | bool      | Default: `false`                | Indicates whether this is the primary image for the vehicle.                |
  | CreatedAt  | DateTime  | Not null, Default: `UTC Now`    | Timestamp of image upload.                                                  |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174012",
    "VehicleId": "123e4567-e89b-12d3-a456-426614174010",
    "ImageUrl": "https://ares-car-rental.s3.amazonaws.com/vehicles/toyota-camry-front.jpg",
    "IsPrimary": true,
    "CreatedAt": "2023-10-01T12:00:00Z"
  }
  ```

#### 12. Category
- **Description**: Represents a category of vehicles (e.g., `Sedan`, `SUV`, `Luxury`).
- **Fields**:
  | Field       | Data Type | Constraints                     | Description                                                                 |
  |-------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id          | Guid      | PK                              | Unique identifier for the category.                                         |
  | Name        | string    | Not null                        | Name of the category.                                                       |
  | Description | string    |                                 | Description of the category.                                                |
  | Icon        | string    |                                 | Icon representing the category (e.g., URL or icon class).                  |
  | CreatedAt   | DateTime  | Not null, Default: `UTC Now`    | Timestamp of category creation.                                             |
  | UpdatedAt   | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174011",
    "Name": "Sedan",
    "Description": "Comfortable sedans for everyday use.",
    "Icon": "car-sedan",
    "CreatedAt": "2023-10-01T12:00:00Z",
    "UpdatedAt": "2023-10-01T12:00:00Z"
  }
  ```

#### 13. CategoryOffer
- **Description**: Stores promotional offers associated with a vehicle category.
- **Fields**:
  | Field               | Data Type | Constraints                     | Description                                                                 |
  |---------------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id                  | Guid      | PK                              | Unique identifier for the category offer.                                   |
  | CategoryId          | Guid      | FK (Category.Id), Not null      | Reference to the category.                                                  |
  | DiscountPercentage  | decimal   | Not null                        | Discount percentage for the offer.                                          |
  | StartDate           | DateTime  | Not null                        | Start date of the offer.                                                    |
  | EndDate             | DateTime  | Not null                        | End date of the offer.                                                      |
  | IsActive            | bool      | Default: `true`                 | Indicates whether the offer is active.                                      |
  | CreatedAt           | DateTime  | Not null, Default: `UTC Now`    | Timestamp of offer creation.                                                |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174013",
    "CategoryId": "123e4567-e89b-12d3-a456-426614174011",
    "DiscountPercentage": 10.00,
    "StartDate": "2023-10-01T00:00:00Z",
    "EndDate": "2023-10-31T23:59:59Z",
    "IsActive": true,
    "CreatedAt": "2023-10-01T12:00:00Z"
  }
  ```

#### 14. Booking
- **Description**: Represents a rental booking for a vehicle.
- **Fields**:
  | Field            | Data Type | Constraints                     | Description                                                                 |
  |------------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id               | Guid      | PK                              | Unique identifier for the booking.                                          |
  | VehicleId        | Guid      | FK (Vehicle.Id), Not null       | Reference to the booked vehicle.                                            |
  | CustomerId       | Guid      | FK (User.Id), Not null          | Reference to the customer who made the booking.                             |
  | DriverId         | Guid      | FK (DriverProfile.Id)           | Reference to the assigned driver (optional).                                |
  | PickupLocationId | Guid      | FK (UserAddress.Id), Not null   | Reference to the pickup location.                                           |
  | ReturnLocationId | Guid      | FK (UserAddress.Id), Not null   | Reference to the return location.                                           |
  | PickupDate       | DateTime  | Not null                        | Pickup date and time for the booking.                                       |
  | ReturnDate       | DateTime  | Not null                        | Return date and time for the booking.                                       |
  | Status           | string    | Not null, Default: `Pending`    | Booking status (e.g., `Pending`, `Confirmed`, `Active`, `Completed`, `Cancelled`). |
  | TotalPrice       | decimal   | Not null                        | Total price for the booking (calculated based on duration and rates).       |
  | BookingNumber    | string    | Not null, Unique                | Unique booking reference number.                                            |
  | CreatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of booking creation.                                              |
  | UpdatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174014",
    "VehicleId": "123e4567-e89b-12d3-a456-426614174010",
    "CustomerId": "123e4567-e89b-12d3-a456-426614174000",
    "DriverId": "123e4567-e89b-12d3-a456-426614174004",
    "PickupLocationId": "123e4567-e89b-12d3-a456-426614174001",
    "ReturnLocationId": "123e4567-e89b-12d3-a456-426614174001",
    "PickupDate": "2023-10-15T09:00:00Z",
    "ReturnDate": "2023-10-20T18:00:00Z",
    "Status": "Confirmed",
    "TotalPrice": 600.00,
    "BookingNumber": "BKG-2023-1001",
    "CreatedAt": "2023-10-10T10:00:00Z",
    "UpdatedAt": "2023-10-10T10:00:00Z"
  }
  ```

#### 15. BookingCheckoutState
- **Description**: Tracks the state of a booking during the checkout process to prevent double bookings.
- **Fields**:
  | Field            | Data Type | Constraints                     | Description                                                                 |
  |------------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id               | Guid      | PK                              | Unique identifier for the checkout state record.                            |
  | BookingId        | Guid      | FK (Booking.Id), Not null, Unique| Reference to the booking.                                                   |
  | State            | string    | Not null, Default: `Draft`      | Current state of the checkout (e.g., `Draft`, `DriverSelected`, `PaymentPending`, `Confirmed`, `Cancelled`). |
  | SelectedDriverId | Guid      | FK (DriverProfile.Id)           | Reference to the selected driver (optional).                                |
  | CreatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of checkout state creation.                                       |
  | UpdatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174015",
    "BookingId": "123e4567-e89b-12d3-a456-426614174014",
    "State": "Confirmed",
    "SelectedDriverId": "123e4567-e89b-12d3-a456-426614174004",
    "CreatedAt": "2023-10-10T10:00:00Z",
    "UpdatedAt": "2023-10-10T10:30:00Z"
  }
  ```

#### 16. Payment
- **Description**: Records payment transactions associated with bookings.
- **Fields**:
  | Field          | Data Type | Constraints                     | Description                                                                 |
  |----------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id             | Guid      | PK                              | Unique identifier for the payment record.                                   |
  | BookingId      | Guid      | FK (Booking.Id), Not null       | Reference to the booking.                                                   |
  | TransactionId  | string    | Not null                        | Unique transaction ID from the payment gateway.                             |
  | Amount         | decimal   | Not null                        | Payment amount.                                                             |
  | Currency       | string    | Not null, Default: `EGP`        | Currency of the payment.                                                    |
  | Status         | string    | Not null, Default: `Pending`    | Payment status (e.g., `Pending`, `Authorized`, `Captured`, `Failed`, `Refunded`). |
  | PaymentMethod  | string    | Not null                        | Payment method (e.g., `CreditCard`, `PayPal`).                              |
  | CreatedAt      | DateTime  | Not null, Default: `UTC Now`    | Timestamp of payment creation.                                              |
  | UpdatedAt      | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174016",
    "BookingId": "123e4567-e89b-12d3-a456-426614174014",
    "TransactionId": "PAY-1234567890",
    "Amount": 600.00,
    "Currency": "EGP",
    "Status": "Captured",
    "PaymentMethod": "CreditCard",
    "CreatedAt": "2023-10-10T10:30:00Z",
    "UpdatedAt": "2023-10-10T10:35:00Z"
  }
  ```

#### 17. Review
- **Description**: Stores reviews submitted by customers for vehicles.
- **Fields**:
  | Field          | Data Type | Constraints                     | Description                                                                 |
  |----------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id             | Guid      | PK                              | Unique identifier for the review.                                           |
  | VehicleId      | Guid      | FK (Vehicle.Id), Not null       | Reference to the reviewed vehicle.                                          |
  | BookingId      | Guid      | FK (Booking.Id), Not null       | Reference to the booking associated with the review.                        |
  | UserId         | Guid      | FK (User.Id), Not null          | Reference to the user who submitted the review.                             |
  | Rating         | int       | Not null, Min: 1, Max: 5        | Rating given by the user (1-5 stars).                                       |
  | Comment        | string    |                                 | Review comment (optional).                                                  |
  | SupplierReply  | string    |                                 | Reply from the supplier (optional).                                         |
  | IsReported     | bool      | Default: `false`                | Indicates whether the review has been reported.                             |
  | ReportReason   | string    |                                 | Reason for reporting the review (optional).                                 |
  | CreatedAt      | DateTime  | Not null, Default: `UTC Now`    | Timestamp of review creation.                                               |
  | UpdatedAt      | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174017",
    "VehicleId": "123e4567-e89b-12d3-a456-426614174010",
    "BookingId": "123e4567-e89b-12d3-a456-426614174014",
    "UserId": "123e4567-e89b-12d3-a456-426614174000",
    "Rating": 5,
    "Comment": "Excellent car and great service!",
    "SupplierReply": "Thank you for your feedback!",
    "CreatedAt": "2023-10-21T10:00:00Z",
    "UpdatedAt": "2023-10-21T10:00:00Z"
  }
  ```

#### 18. DriverReview
- **Description**: Stores reviews submitted by customers for drivers.
- **Fields**:
  | Field          | Data Type | Constraints                     | Description                                                                 |
  |----------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id             | Guid      | PK                              | Unique identifier for the driver review.                                    |
  | BookingId      | Guid      | FK (Booking.Id), Not null       | Reference to the booking associated with the review.                        |
  | DriverProfileId| Guid      | FK (DriverProfile.Id), Not null | Reference to the reviewed driver.                                           |
  | UserId         | Guid      | FK (User.Id), Not null          | Reference to the user who submitted the review.                             |
  | Rating         | int       | Not null, Min: 1, Max: 5        | Rating given by the user (1-5 stars).                                       |
  | Comment        | string    |                                 | Review comment (optional).                                                  |
  | CreatedAt      | DateTime  | Not null, Default: `UTC Now`    | Timestamp of review creation.                                               |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174018",
    "BookingId": "123e4567-e89b-12d3-a456-426614174014",
    "DriverProfileId": "123e4567-e89b-12d3-a456-426614174004",
    "UserId": "123e4567-e89b-12d3-a456-426614174000",
    "Rating": 5,
    "Comment": "Very professional and friendly driver!",
    "CreatedAt": "2023-10-21T10:00:00Z"
  }
  ```

#### 19. Notification
- **Description**: Stores notifications sent to users.
- **Fields**:
  | Field      | Data Type | Constraints                     | Description                                                                 |
  |------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id         | Guid      | PK                              | Unique identifier for the notification.                                     |
  | UserId     | Guid      | FK (User.Id), Not null          | Reference to the user who receives the notification.                        |
  | Title      | string    | Not null                        | Title of the notification.                                                  |
  | Message    | string    | Not null                        | Content of the notification.                                                |
  | Type       | string    | Not null                        | Type of notification (e.g., `BookingConfirmation`, `PaymentReceived`).      |
  | IsRead     | bool      | Default: `false`                | Indicates whether the notification has been read.                           |
  | CreatedAt  | DateTime  | Not null, Default: `UTC Now`    | Timestamp of notification creation.                                         |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174019",
    "UserId": "123e4567-e89b-12d3-a456-426614174000",
    "Title": "Booking Confirmed",
    "Message": "Your booking BKG-2023-1001 has been confirmed.",
    "Type": "BookingConfirmation",
    "IsRead": true,
    "CreatedAt": "2023-10-10T10:35:00Z"
  }
  ```

#### 20. Inspection
- **Description**: Stores vehicle inspection records conducted by inspectors.
- **Fields**:
  | Field            | Data Type | Constraints                     | Description                                                                 |
  |------------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id               | Guid      | PK                              | Unique identifier for the inspection.                                       |
  | BookingId        | Guid      | FK (Booking.Id), Not null       | Reference to the booking associated with the inspection.                   |
  | InspectorId      | Guid      | FK (User.Id), Not null          | Reference to the inspector who conducted the inspection.                   |
  | Status           | string    | Not null, Default: `Pending`    | Inspection status (e.g., `Pending`, `Approved`, `Rejected`).                |
  | Notes            | string    |                                 | Additional notes from the inspector (optional).                             |
  | OdometerReading  | int       |                                 | Odometer reading at the time of inspection (optional).                      |
  | FuelLevel        | string    |                                 | Fuel level at the time of inspection (e.g., `Full`, `Half`, `Empty`).       |
  | VehicleCondition | string    |                                 | Condition of the vehicle (e.g., `Good`, `Fair`, `Poor`).                    |
  | CreatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of inspection creation.                                           |
  | UpdatedAt        | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174020",
    "BookingId": "123e4567-e89b-12d3-a456-426614174014",
    "InspectorId": "123e4567-e89b-12d3-a456-426614174021",
    "Status": "Approved",
    "Notes": "No visible damage. Vehicle is clean and well-maintained.",
    "OdometerReading": 15000,
    "FuelLevel": "Full",
    "VehicleCondition": "Good",
    "CreatedAt": "2023-10-15T08:30:00Z",
    "UpdatedAt": "2023-10-15T08:45:00Z"
  }
  ```

#### 21. InspectionImage
- **Description**: Stores images uploaded during vehicle inspections.
- **Fields**:
  | Field         | Data Type | Constraints                     | Description                                                                 |
  |---------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id            | Guid      | PK                              | Unique identifier for the inspection image.                                 |
  | InspectionId  | Guid      | FK (Inspection.Id), Not null    | Reference to the inspection.                                                |
  | ImageUrl      | string    | Not null                        | URL of the image stored in AWS S3.                                          |
  | CreatedAt     | DateTime  | Not null, Default: `UTC Now`    | Timestamp of image upload.                                                  |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174022",
    "InspectionId": "123e4567-e89b-12d3-a456-426614174020",
    "ImageUrl": "https://ares-car-rental.s3.amazonaws.com/inspections/front.jpg",
    "CreatedAt": "2023-10-15T08:35:00Z"
  }
  ```

#### 22. SystemSetting
- **Description**: Stores system-wide settings and configurations.
- **Fields**:
  | Field      | Data Type | Constraints                     | Description                                                                 |
  |------------|-----------|---------------------------------|-----------------------------------------------------------------------------|
  | Id         | Guid      | PK                              | Unique identifier for the system setting.                                   |
  | Key        | string    | Not null, Unique                | Key of the setting (e.g., `GlobalCommissionPercentage`).                    |
  | Value      | string    | Not null                        | Value of the setting.                                                       |
  | CreatedAt  | DateTime  | Not null, Default: `UTC Now`    | Timestamp of setting creation.                                              |
  | UpdatedAt  | DateTime  | Not null, Default: `UTC Now`    | Timestamp of last update.                                                   |
- **Sample Data**:
  ```json
  {
    "Id": "123e4567-e89b-12d3-a456-426614174023",
    "Key": "GlobalCommissionPercentage",
    "Value": "10.00",
    "CreatedAt": "2023-10-01T12:00:00Z",
    "UpdatedAt": "2023-10-01T12:00:00Z"
  }
  ```

---

## 3.5 API Documentation

The Ares Car Rental system exposes a **RESTful API** to facilitate communication between the frontend and backend. This section documents all key endpoints, including their methods, descriptions, payload formats, response formats, and status codes. The API follows **RESTful conventions**, using HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) to perform operations on resources.

### API Endpoints
Below is a comprehensive table of all RESTful endpoints, grouped by functional area.

#### Authentication
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| POST   | `/api/auth/register`              | Register a new user account.                                               | `{ "email": "string", "password": "string", "firstName": "string", "lastName": "string", "acceptedTerms": true, "acceptedPrivacy": true }` | `{ "userId": "guid", "email": "string", "emailVerified": false }`               | 201, 400, 409, 429               |
| POST   | `/api/auth/login`                 | Authenticate a user and generate a JWT token.                              | `{ "email": "string", "password": "string", "stayConnected": false }`         | `{ "token": "string", "expiresAt": "datetime", "user": { "id": "guid", "email": "string", "firstName": "string", "lastName": "string", "roles": ["string"], "emailVerified": true } }` | 200, 400, 401, 403, 429 |
| POST   | `/api/auth/forgot-password`       | Request a password reset email.                                            | `{ "email": "string" }`                                                       | `{ "message": "string" }`                                                      | 200, 400, 404                    |
| POST   | `/api/auth/reset-password`        | Reset password using a token.                                              | `{ "userId": "guid", "token": "string", "newPassword": "string" }`            | `{ "message": "string" }`                                                      | 200, 400, 401                    |
| POST   | `/api/auth/verify-email`          | Verify email address using a token.                                        | `{ "userId": "guid", "token": "string" }`                                     | `{ "message": "string" }`                                                      | 200, 400, 401                    |
| POST   | `/api/auth/refresh-token`         | Refresh an expired JWT token using a refresh token.                        | `{ "refreshToken": "string" }`                                                | `{ "token": "string", "refreshToken": "string", "expiresAt": "datetime" }`     | 200, 401                        |
| POST   | `/api/auth/revoke-token`          | Revoke a refresh token.                                                    | `{ "refreshToken": "string" }`                                                | `{ "message": "string" }`                                                      | 200, 401, 404                    |
| POST   | `/api/auth/google-signin`         | Sign in or sign up using Google OAuth.                                     | `{ "idToken": "string", "role": "string" }`                                   | `{ "token": "string", "expiresAt": "datetime", "user": { ... } }`              | 200, 400, 401, 403              |
| GET    | `/api/auth/demo-roles`            | Get available roles for demo login.                                        | -                                                                              | `["Customer", "Supplier", "Driver", "Inspector", "Admin"]`                     | 200                             |
| POST   | `/api/auth/demo-login`            | Log in as a demo user with a specified role.                               | `{ "role": "string" }`                                                        | `{ "token": "string", "expiresAt": "datetime", "user": { ... } }`              | 200, 400                        |

#### User Profile
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/users/profile/{userId}`     | Get user profile information.                                              | -                                                                              | `{ "id": "guid", "email": "string", "firstName": "string", "lastName": "string", "phoneNumber": "string", "role": "string", "status": "string", "emailVerified": true, "addresses": [{ ... }], "verificationStatus": "string", "profileCompleteness": 0.8 }` | 200, 401, 403, 404 |
| PUT    | `/api/users/profile`              | Update user profile information.                                           | `{ "firstName": "string", "lastName": "string", "phoneNumber": "string", "address": { "addressLine1": "string", "addressLine2": "string", "city": "string", "governorate": "string", "country": "string", "postalCode": "string" } }` | `{ "message": "string", "verificationRequired": true }`                       | 200, 400, 401, 403              |
| POST   | `/api/users/profile/photo`        | Upload user profile photo.                                                 | `multipart/form-data` (file)                                                   | `{ "photoUrl": "string" }`                                                     | 200, 400, 401, 403              |
| POST   | `/api/users/change-password`      | Change user password.                                                      | `{ "currentPassword": "string", "newPassword": "string" }`                    | `{ "message": "string" }`                                                      | 200, 400, 401                    |

#### Driver License
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| POST   | `/api/driver-license`             | Submit or update driver license for verification.                          | `multipart/form-data` (frontImage, backImage)                                  | `{ "status": "string", "expiryDate": "datetime", "frontImageUrl": "string", "backImageUrl": "string" }` | 200, 400, 401 |
| GET    | `/api/driver-license`             | Get current driver license status.                                         | -                                                                              | `{ "status": "string", "expiryDate": "datetime", "frontImageUrl": "string", "backImageUrl": "string" }` | 200, 401, 404 |

#### Driver Profile
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/driver-profile/me`          | Get authenticated driver's profile.                                        | -                                                                              | `{ "id": "guid", "licenseNumber": "string", "licenseExpiryDate": "datetime", "profileImageUrl": "string", "isAvailable": true, "status": "string", "payoutInfo": { ... } }` | 200, 401, 404 |
| POST   | `/api/driver-profile/complete`    | Complete driver profile (upload license and profile image).                | `multipart/form-data` (licenseFront, licenseBack, profileImage)                | `{ "status": "string", "message": "string" }`                                  | 200, 400, 401                    |
| PATCH  | `/api/driver-profile/availability`| Update driver availability.                                                | `{ "isAvailable": true }`                                                     | `{ "isAvailable": true, "message": "string" }`                                 | 200, 400, 401                    |
| GET    | `/api/driver-profile/payout-info` | Get driver's payout information.                                           | -                                                                              | `{ "walletAddress": "string", "walletType": "string", "status": "string" }`    | 200, 401, 404                    |
| PUT    | `/api/driver-profile/payout-info` | Update driver's payout information.                                        | `{ "walletAddress": "string", "walletType": "string" }`                       | `{ "walletAddress": "string", "walletType": "string", "status": "string" }`    | 200, 400, 401                    |

#### Vehicle Management
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/vehicles/search`            | Search for available vehicles with filters.                                | Query params: `pickupLocationId`, `returnLocationId`, `pickupDate`, `returnDate`, `category`, `transmission`, `minPrice`, `maxPrice`, `sortBy`, `page`, `limit` | `{ "data": [{ "id": "guid", "make": "string", "model": "string", "year": 2022, "dailyRate": 100.00, "hourlyRate": 20.00, "imageUrl": "string", "rating": 4.5, "seats": 5, "transmission": "string", "fuelType": "string" }], "pageInfo": { "totalRecords": 100, "totalPages": 10, "currentPage": 1, "pageSize": 10 } }` | 200, 400 |
| GET    | `/api/vehicles/{vehicleId}`       | Get detailed information about a specific vehicle.                         | -                                                                              | `{ "id": "guid", "make": "string", "model": "string", "year": 2022, "licensePlate": "string", "color": "string", "seats": 5, "transmission": "string", "fuelType": "string", "dailyRate": 100.00, "hourlyRate": 20.00, "status": "string", "availabilityStatus": "string", "images": ["string"], "category": { "id": "guid", "name": "string" }, "supplier": { "id": "guid", "businessName": "string" }, "rating": 4.5 }` | 200, 404 |
| GET    | `/api/vehicles/{vehicleId}/availability` | Get availability calendar for a vehicle.                          | Query params: `startDate`, `endDate`                                           | `{ "vehicleId": "guid", "bookedDates": ["datetime"], "blockedDates": ["datetime"] }` | 200, 404 |
| POST   | `/api/vehicles/{vehicleId}/calculate-pricing` | Calculate pricing for a vehicle rental.                          | `{ "pickupDate": "datetime", "returnDate": "datetime", "insuranceOptions": "string", "additionalServices": ["string"] }` | `{ "basePrice": 500.00, "insurance": 50.00, "additionalServices": 30.00, "totalPrice": 580.00, "breakdown": [{ "name": "string", "amount": 100.00 }] }` | 200, 400, 404 |
| GET    | `/api/vehicles/{vehicleId}/images`| Get all images for a vehicle.                                              | Query param: `size` (thumbnail, medium, large)                                 | `["string"]`                                                                    | 200, 404                         |
| GET    | `/api/vehicles/{vehicleId}/reviews` | Get reviews for a vehicle.                                               | Query params: `page`, `pageSize`, `sortBy`                                     | `{ "data": [{ "id": "guid", "rating": 5, "comment": "string", "user": { "id": "guid", "firstName": "string", "lastName": "string" }, "createdAt": "datetime" }], "pageInfo": { ... } }` | 200, 404 |
| POST   | `/api/vehicles/{vehicleId}/favorites` | Add a vehicle to user's favorites.                                      | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 404                    |
| GET    | `/api/admin/vehicles`             | Search vehicles for Admin/Supplier dashboard.                              | Query params: `search`, `status`, `availabilityStatus`, `page`, `pageSize`    | `{ "data": [{ "id": "guid", "make": "string", "model": "string", "licensePlate": "string", "status": "string", "availabilityStatus": "string", "isActive": true }], "pageInfo": { ... } }` | 200, 401, 403 |
| POST   | `/api/admin/vehicles`             | Create a new vehicle (Admin/Supplier only).                                | `{ "categoryId": "guid", "make": "string", "model": "string", "year": 2022, "licensePlate": "string", "color": "string", "seats": 5, "transmission": "string", "fuelType": "string", "dailyRate": 100.00, "hourlyRate": 20.00 }` | `{ "id": "guid", "message": "string" }` | 201, 400, 401, 403 |
| PUT    | `/api/admin/vehicles/{id}`        | Update an existing vehicle (Admin/Supplier only).                          | `{ "categoryId": "guid", "make": "string", "model": "string", "year": 2022, "licensePlate": "string", "color": "string", "seats": 5, "transmission": "string", "fuelType": "string", "dailyRate": 100.00, "hourlyRate": 20.00, "status": "string", "availabilityStatus": "string" }` | `{ "id": "guid", "message": "string" }` | 200, 400, 401, 403, 404 |
| DELETE | `/api/admin/vehicles/{id}`        | Delete a vehicle (Admin/Supplier only).                                    | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |
| GET    | `/api/admin/vehicles/{id}/bookings` | Check if a vehicle has active bookings (Admin/Supplier only).            | -                                                                              | `{ "hasActiveBookings": true }`                                                | 200, 401, 403, 404              |
| GET    | `/api/admin/vehicles/stats`       | Get aggregate vehicle statistics (Admin/Supplier only).                    | -                                                                              | `{ "totalVehicles": 100, "availableVehicles": 50, "onRentalVehicles": 30 }`    | 200, 401, 403                   |
| POST   | `/api/admin/vehicles/{id}/images` | Upload an image for a vehicle (Admin/Supplier only).                       | `multipart/form-data` (file)                                                   | `{ "imageUrl": "string", "isPrimary": true }`                                  | 200, 400, 401, 403, 404        |

#### Booking Management
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| POST   | `/api/bookings`                   | Create a new booking for a vehicle.                                        | `{ "vehicleId": "guid", "pickupLocationId": "guid", "returnLocationId": "guid", "pickupDate": "datetime", "returnDate": "datetime", "customerId": "guid" }` | `{ "bookingId": "guid", "bookingNumber": "string", "status": "string", "totalPrice": 600.00 }` | 201, 400, 401, 403 |
| GET    | `/api/bookings/has-user-bookings` | Check if a user has any bookings.                                          | Query param: `driverId`                                                        | `{ "hasBookings": true }`                                                      | 200, 400, 401                    |
| GET    | `/api/bookings/user`              | Get paginated list of user bookings with filters.                          | Query params: `page`, `size`, `status`, `search`, `sortBy`, `sortOrder`       | `{ "data": [{ "id": "guid", "bookingNumber": "string", "vehicle": { "id": "guid", "make": "string", "model": "string", "imageUrl": "string" }, "pickupDate": "datetime", "returnDate": "datetime", "status": "string", "totalPrice": 600.00 }], "pageInfo": { ... } }` | 200, 401 |
| GET    | `/api/bookings/history`           | Get booking history with filtering and sorting.                            | Query params: `status`, `startDate`, `endDate`, `supplierId`, `search`, `page`, `limit`, `sortBy`, `sortOrder` | `{ "data": [{ "id": "guid", "bookingNumber": "string", "vehicle": { ... }, "pickupDate": "datetime", "returnDate": "datetime", "status": "string", "totalPrice": 600.00 }], "pageInfo": { ... } }` | 200, 401 |
| GET    | `/api/bookings/{id}`              | Get detailed information about a specific booking.                         | -                                                                              | `{ "id": "guid", "bookingNumber": "string", "vehicle": { ... }, "customer": { ... }, "driver": { ... }, "pickupLocation": { ... }, "returnLocation": { ... }, "pickupDate": "datetime", "returnDate": "datetime", "status": "string", "totalPrice": 600.00, "payment": { ... }, "inspection": { ... }, "canCancel": true, "refundAmount": 540.00 }` | 200, 401, 403, 404 |
| GET    | `/api/bookings/{id}/cancel-preview` | Get cancellation refund preview.                                         | -                                                                              | `{ "canCancel": true, "refundAmount": 540.00, "cancellationFee": 60.00 }`     | 200, 401, 403, 404              |
| POST   | `/api/bookings/{id}/cancel`       | Cancel a booking.                                                          | -                                                                              | `{ "message": "string", "refundAmount": 540.00 }`                              | 200, 400, 401, 403, 404         |
| GET    | `/api/admin/bookings/stats`       | Get operational booking stats for Admin/Supplier dashboard.                | -                                                                              | `{ "totalBookings": 100, "pendingBookings": 10, "confirmedBookings": 50, "activeBookings": 30, "completedBookings": 10 }` | 200, 401, 403 |
| GET    | `/api/admin/bookings/analytics`   | Get complex analytics and queues for Bookings Management dashboard.        | -                                                                              | `{ "pendingBookings": 10, "pendingVerifications": 5, "pendingInspections": 3, "pendingPayments": 2, "recentBookings": [{ ... }], "revenueTrend": [{ "date": "datetime", "revenue": 1000.00 }] }` | 200, 401, 403 |
| GET    | `/api/admin/bookings`             | Search bookings for Admin/Supplier dashboard.                              | Query params: `search`, `bookingStatus`, `paymentStatus`, `page`, `pageSize`  | `{ "data": [{ "id": "guid", "bookingNumber": "string", "vehicle": { ... }, "customer": { ... }, "pickupDate": "datetime", "returnDate": "datetime", "status": "string", "paymentStatus": "string", "totalPrice": 600.00 }], "pageInfo": { ... } }` | 200, 401, 403 |
| GET    | `/api/admin/bookings/{id}`        | Get booking details for Admin/Supplier dashboard.                          | -                                                                              | `{ "id": "guid", "bookingNumber": "string", "vehicle": { ... }, "customer": { ... }, "driver": { ... }, "pickupLocation": { ... }, "returnLocation": { ... }, "pickupDate": "datetime", "returnDate": "datetime", "status": "string", "payment": { ... }, "inspection": { ... } }` | 200, 401, 403, 404 |
| PATCH  | `/api/admin/bookings/{id}/status` | Update booking status.                                                     | `{ "status": "string" }`                                                       | `{ "message": "string" }`                                                      | 200, 400, 401, 403, 404         |
| PUT    | `/api/admin/bookings/{id}`        | Edit a booking (partial update).                                           | `{ "pickupDate": "datetime", "returnDate": "datetime", "pickupLocationId": "guid", "returnLocationId": "guid", "status": "string" }` | `{ "id": "guid", "bookingNumber": "string", "pickupDate": "datetime", "returnDate": "datetime", "status": "string", "totalPrice": 600.00 }` | 200, 400, 401, 403, 404 |
| POST   | `/api/admin/bookings/delete`      | Bulk delete selected bookings.                                             | `{ "ids": ["guid"] }`                                                          | `{ "message": "string", "deletedCount": 5 }`                                   | 200, 400, 401, 403              |
| GET    | `/api/admin/bookings/customers`   | Searchable customer picker for the create-booking flow.                    | Query params: `search`, `limit`                                                | `[{ "id": "guid", "name": "string", "email": "string", "phoneNumber": "string" }]` | 200, 401, 403 |
| GET    | `/api/admin/bookings/vehicles`    | Searchable available-vehicles picker for the create-booking flow.          | Query params: `pickupLocationId`, `returnLocationId`, `pickupDate`, `returnDate`, `customerUserId`, `search`, `limit` | `[{ "id": "guid", "name": "string", "licensePlate": "string", "imageUrl": "string", "supplierName": "string" }]` | 200, 401, 403 |

#### Checkout
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/checkout/eligibility`       | Check if the customer may self-drive.                                      | -                                                                              | `{ "canSelfDrive": true, "isDriverSelectionMandatory": false }`                | 200, 401                        |
| GET    | `/api/checkout/drivers`           | Get available drivers for the supplied rental window.                      | Query params: `pickupDate`, `returnDate`, `bookingId`                         | `{ "drivers": [{ "id": "guid", "name": "string", "profileImageUrl": "string", "rating": 4.5, "fee": 50.00, "distanceKm": 5.0 }] }` | 200, 401 |
| POST   | `/api/checkout`                   | Complete checkout: validate reservation, process payment, and create booking. | `{ "bookingId": "guid", "paymentMethod": "string", "paymentToken": "string" }` | `{ "bookingId": "guid", "bookingNumber": "string", "status": "string" }`       | 201, 400, 401, 409              |
| POST   | `/api/checkout/draft`             | Create or resume a draft booking.                                          | `{ "vehicleId": "guid", "pickupLocationId": "guid", "returnLocationId": "guid", "pickupDate": "datetime", "returnDate": "datetime" }` | `{ "bookingId": "guid", "state": "string" }`                                   | 200, 400, 401                   |
| POST   | `/api/checkout/driver`            | Record the driver choice.                                                  | `{ "driverProfileId": "guid" }`                                               | `{ "bookingId": "guid", "state": "string" }`                                   | 200, 400, 401, 409              |
| POST   | `/api/checkout/payment`           | Enter payment: place a hold on the vehicle.                                | -                                                                              | `{ "bookingId": "guid", "state": "string", "paymentIntentId": "string" }`      | 200, 400, 401, 409              |
| POST   | `/api/checkout/confirm`           | Confirm: capture payment and finalize booking.                             | `{ "paymentIntentId": "string" }`                                             | `{ "bookingId": "guid", "bookingNumber": "string", "status": "string" }`       | 200, 400, 401, 409              |
| POST   | `/api/checkout/cancel`            | Cancel an in-flight checkout.                                               | -                                                                              | `{ "bookingId": "guid", "state": "string" }`                                   | 200, 400, 401                   |
| GET    | `/api/checkout/active`            | Get the caller's current resumable checkout.                               | -                                                                              | `{ "bookingId": "guid", "vehicleId": "guid", "state": "string", "selectedDriverId": "guid", "paymentIntentId": "string" }` | 200, 204, 401 |
| GET    | `/api/checkout/{bookingId}`       | Get checkout state for a specific booking.                                 | -                                                                              | `{ "bookingId": "guid", "state": "string", "selectedDriverId": "guid", "paymentIntentId": "string" }` | 200, 401, 404 |

#### Customer Driver Selection
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/customer-driver-selection/{bookingId}/available` | Get available drivers for a booking.                              | -                                                                              | `[{ "id": "guid", "name": "string", "profileImageUrl": "string", "rating": 4.5, "fee": 50.00 }]` | 200, 401, 404 |
| POST   | `/api/customer-driver-selection/{bookingId}/select` | Select a driver for a booking.                                      | `{ "driverProfileId": "guid" }`                                               | `{ "message": "string" }`                                                      | 200, 400, 401, 404              |
| POST   | `/api/customer-driver-selection/{bookingId}/change` | Change the selected driver for a booking.                              | `{ "driverProfileId": "guid" }`                                               | `{ "message": "string" }`                                                      | 200, 400, 401, 404              |
| POST   | `/api/customer-driver-selection/{bookingId}/cancel` | Cancel the selected driver for a booking.                              | -                                                                              | `{ "message": "string" }`                                                      | 200, 400, 401, 404              |

#### Driver Assignments
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/driver-assignments`         | Get bookings assigned to the authenticated driver.                         | -                                                                              | `[{ "id": "guid", "bookingNumber": "string", "vehicle": { "make": "string", "model": "string", "imageUrl": "string" }, "customer": { "name": "string", "phoneNumber": "string" }, "pickupDate": "datetime", "returnDate": "datetime", "status": "string" }]` | 200, 401 |
| POST   | `/api/driver-assignments/{bookingId}/cancel` | Driver-initiated cancellation of an assignment.                     | -                                                                              | `{ "message": "string" }`                                                      | 200, 400, 401, 404              |

#### Driver Reviews
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/driver-reviews/{driverProfileId}` | Get reviews for a driver.                                         | -                                                                              | `[{ "id": "guid", "rating": 5, "comment": "string", "user": { "firstName": "string", "lastName": "string" }, "createdAt": "datetime" }]` | 200, 404 |
| POST   | `/api/driver-reviews/{bookingId}` | Create a review for a driver.                                             | `{ "rating": 5, "comment": "string" }`                                         | `{ "id": "guid", "message": "string" }`                                         | 201, 400, 401, 404              |

#### Reviews
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/reviews/{vehicleId}`        | Get reviews for a specific vehicle.                                        | Query params: `page`, `pageSize`, `sortBy`                                     | `{ "data": [{ "id": "guid", "rating": 5, "comment": "string", "user": { "id": "guid", "firstName": "string", "lastName": "string" }, "createdAt": "datetime", "supplierReply": "string" }], "pageInfo": { ... } }` | 200, 404 |
| POST   | `/api/reviews`                    | Create a new review for a vehicle.                                         | `{ "vehicleId": "guid", "bookingId": "guid", "rating": 5, "comment": "string" }` | `{ "id": "guid", "message": "string" }`                                         | 201, 400, 401, 404              |
| GET    | `/api/reviews/booking/{bookingId}`| Get the review attached to a specific booking.                             | -                                                                              | `{ "id": "guid", "rating": 5, "comment": "string", "createdAt": "datetime" }`   | 200, 204, 401, 404              |
| PUT    | `/api/reviews/{reviewId}`         | Update an existing review within the 24h edit window.                      | `{ "rating": 5, "comment": "string" }`                                         | `{ "id": "guid", "message": "string" }`                                         | 200, 400, 401, 403, 404         |

#### Supplier Reviews
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/supplier/reviews`           | Get paginated, filtered, sorted list of reviews for the supplier's vehicles. | Query params: `vehicleId`, `rating`, `replyStatus`, `fromDate`, `toDate`, `sortBy`, `page`, `pageSize` | `{ "data": [{ "id": "guid", "vehicle": { "id": "guid", "make": "string", "model": "string" }, "rating": 5, "comment": "string", "user": { "firstName": "string", "lastName": "string" }, "createdAt": "datetime", "supplierReply": "string", "isReported": true }], "pageInfo": { ... } }` | 200, 401, 403 |
| GET    | `/api/supplier/reviews/statistics`| Get aggregate review statistics for the supplier's vehicles.               | -                                                                              | `{ "averageRating": 4.5, "totalReviews": 100, "fiveStarCount": 60, "pendingReplyCount": 10 }` | 200, 401, 403 |
| POST   | `/api/supplier/reviews/{reviewId}/reply` | Create or update the supplier reply on a review.                     | `{ "reply": "string" }`                                                        | `{ "id": "guid", "supplierReply": "string" }`                                   | 200, 400, 401, 403, 404         |
| POST   | `/api/supplier/reviews/{reviewId}/report` | Flag a review as inappropriate.                                      | `{ "reason": "string" }`                                                       | `{ "id": "guid", "isReported": true, "reportReason": "string" }`                | 200, 400, 401, 403, 404         |

#### Notifications
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/notifications`              | Get all notifications for the authenticated user.                          | -                                                                              | `[{ "id": "guid", "title": "string", "message": "string", "type": "string", "isRead": false, "createdAt": "datetime" }]` | 200, 401 |
| PATCH  | `/api/notifications/{id}/read`    | Mark a notification as read.                                                | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 404                    |
| PATCH  | `/api/notifications/read-all`     | Mark all notifications as read.                                             | -                                                                              | `{ "updated": 5 }`                                                              | 200, 401                        |
| GET    | `/api/notifications/count`        | Get the count of unread notifications.                                      | -                                                                              | `{ "unreadCount": 5 }`                                                          | 200, 401                        |
| DELETE | `/api/notifications/{id}`         | Delete a notification.                                                      | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 404                    |

#### Supplier Notifications
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/supplier/notifications`     | Get paginated notifications for the supplier.                              | Query params: `filter`, `page`, `pageSize`                                     | `{ "data": [{ "id": "guid", "title": "string", "message": "string", "type": "string", "isRead": false, "createdAt": "datetime" }], "pageInfo": { ... } }` | 200, 401, 403 |
| GET    | `/api/supplier/notifications/count` | Get the unread notification count for the supplier.                       | -                                                                              | `{ "unreadCount": 5 }`                                                          | 200, 401, 403                   |
| PATCH  | `/api/supplier/notifications/{id}/read` | Mark a notification as read.                                         | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |
| PATCH  | `/api/supplier/notifications/read-all` | Mark all notifications as read.                                      | -                                                                              | `{ "updated": 5 }`                                                              | 200, 401, 403                   |
| DELETE | `/api/supplier/notifications/{id}`| Delete a notification.                                                      | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |

#### Payments
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/payments/history`           | Get payment history for the authenticated user.                            | Query params: `page`, `pageSize`, `status`, `startDate`, `endDate`            | `{ "data": [{ "id": "guid", "transactionId": "string", "bookingId": "guid", "amount": 600.00, "currency": "string", "status": "string", "paymentMethod": "string", "createdAt": "datetime" }], "pageInfo": { ... } }` | 200, 401 |
| GET    | `/api/payments/{transactionId}`   | Get details of a specific payment transaction.                             | -                                                                              | `{ "id": "guid", "transactionId": "string", "bookingId": "guid", "amount": 600.00, "currency": "string", "status": "string", "paymentMethod": "string", "createdAt": "datetime" }` | 200, 401, 404 |
| GET    | `/api/payments/{transactionId}/receipt` | Generate and download a receipt for a payment transaction.          | Query param: `format` (pdf, html)                                              | File download                                                                   | 200, 401, 404                    |
| GET    | `/api/payments/pending`           | Get pending payment transactions.                                          | -                                                                              | `[{ "id": "guid", "transactionId": "string", "bookingId": "guid", "amount": 600.00, "dueDate": "datetime" }]` | 200, 401 |
| GET    | `/api/payments/failed`            | Get recent failed payment attempts.                                        | Query param: `limit`                                                           | `[{ "id": "guid", "transactionId": "string", "bookingId": "guid", "amount": 600.00, "createdAt": "datetime" }]` | 200, 401 |
| POST   | `/api/payments`                   | Create a new payment for a booking.                                        | `{ "bookingId": "guid", "paymentMethod": "string", "paymentToken": "string" }` | `{ "transactionId": "string", "amount": 600.00, "status": "string" }`          | 201, 400, 401, 404              |
| POST   | `/api/payments/initiate`          | Initiate payment with Paymob.                                              | `{ "bookingId": "guid" }`                                                     | `{ "paymentKey": "string", "iframeUrl": "string" }`                            | 200, 400, 401, 404              |
| POST   | `/api/payments/paymob-callback`   | Paymob callback endpoint for payment confirmation.                         | Query params: `success`, `id`, `booking_id`                                    | Redirect to frontend                                                            | 302                              |
| POST   | `/api/payments/paymob-webhook`    | Paymob webhook endpoint for payment status updates.                        | JSON payload from Paymob                                                       | `{ "message": "string" }`                                                      | 200                              |
| POST   | `/api/payments/{bookingId}/refund`| Admin refund endpoint.                                                      | `{ "amount": 600.00 }`                                                         | `{ "refundId": "string", "amount": 600.00, "status": "string" }`               | 200, 400, 401, 403, 404         |

#### Supplier Bookings
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/supplier/bookings`          | Get paginated list of bookings for the supplier's vehicles.                | Query params: `search`, `bookingStatus`, `paymentStatus`, `page`, `pageSize`  | `{ "data": [{ "id": "guid", "bookingNumber": "string", "vehicle": { "make": "string", "model": "string" }, "customer": { "name": "string" }, "pickupDate": "datetime", "returnDate": "datetime", "status": "string", "paymentStatus": "string", "totalPrice": 600.00 }], "pageInfo": { ... } }` | 200, 401, 403 |
| GET    | `/api/supplier/bookings/{id}`     | Get details of a single booking owned by the supplier.                     | -                                                                              | `{ "id": "guid", "bookingNumber": "string", "vehicle": { ... }, "customer": { ... }, "pickupLocation": { ... }, "returnLocation": { ... }, "pickupDate": "datetime", "returnDate": "datetime", "status": "string", "payment": { ... }, "inspection": { ... } }` | 200, 401, 403, 404 |

#### Supplier Earnings
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/supplier/earnings/stats`    | Get headline earnings figures for the supplier.                            | -                                                                              | `{ "totalEarnings": 10000.00, "thisMonthRevenue": 2000.00, "lastMonthRevenue": 1500.00, "completedBookingsCount": 50 }` | 200, 401, 403 |
| GET    | `/api/supplier/earnings/chart`    | Get 12 monthly revenue data points for the supplier.                        | Query param: `year`                                                            | `[{ "month": "January", "revenue": 1000.00 }]`                                  | 200, 401, 403                   |
| GET    | `/api/supplier/earnings/top-vehicles` | Get top 5 vehicles by earnings.                                         | -                                                                              | `[{ "vehicleId": "guid", "make": "string", "model": "string", "earnings": 5000.00 }]` | 200, 401, 403 |

#### Driver Earnings
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/driver/earnings/stats`      | Get earnings statistics for the driver dashboard.                          | -                                                                              | `{ "totalEarnings": 5000.00, "availableBalance": 2000.00, "pendingBalance": 3000.00, "completedBookingsCount": 20 }` | 200, 401 |
| GET    | `/api/driver/earnings/chart`      | Get monthly earnings data for the chart.                                   | Query param: `year`                                                            | `[{ "month": "January", "earnings": 500.00 }]`                                  | 200, 401                        |
| GET    | `/api/driver/earnings/top-bookings` | Get top 5 highest-earning bookings.                                      | -                                                                              | `[{ "bookingId": "guid", "bookingNumber": "string", "vehicle": { "make": "string", "model": "string" }, "earnings": 250.00, "date": "datetime" }]` | 200, 401 |
| GET    | `/api/driver/earnings/history`    | Get paginated earnings history.                                             | Query params: `pageNumber`, `pageSize`                                         | `[{ "id": "guid", "bookingId": "guid", "bookingNumber": "string", "vehicle": { "make": "string", "model": "string" }, "amount": 250.00, "status": "string", "date": "datetime" }]` | 200, 401 |
| POST   | `/api/driver/earnings/payout`     | Request a payout of available balance.                                     | `{ "amount": 2000.00 }`                                                        | `{ "id": "guid", "amount": 2000.00, "status": "string", "createdAt": "datetime" }` | 200, 400, 401                   |
| GET    | `/api/driver/earnings/payout-history` | Get payout history for the driver.                                      | -                                                                              | `[{ "id": "guid", "amount": 2000.00, "status": "string", "transactionReference": "string", "createdAt": "datetime" }]` | 200, 401 |

#### Admin: User Verification
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/admin/verifications`        | List verification requests for admin review.                               | Query params: `page`, `pageSize`, `status`                                     | `{ "data": [{ "id": "guid", "user": { "id": "guid", "firstName": "string", "lastName": "string", "email": "string" }, "status": "string", "createdAt": "datetime" }], "pageInfo": { ... } }` | 200, 401, 403 |
| POST   | `/api/admin/verifications/{id}/approve` | Approve a pending verification request.                              | -                                                                              | `{ "id": "guid", "status": "Approved" }`                                        | 200, 401, 403, 404              |
| POST   | `/api/admin/verifications/{id}/reject` | Reject a pending verification request.                                | `{ "reason": "string" }`                                                       | `{ "id": "guid", "status": "Rejected", "rejectionReason": "string" }`           | 200, 400, 401, 403, 404         |

#### Admin: Driver License Verification
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/admin/driver-licenses`      | List driver license requests for admin review.                             | Query params: `page`, `pageSize`, `status`                                     | `{ "data": [{ "id": "guid", "user": { "id": "guid", "firstName": "string", "lastName": "string", "email": "string" }, "licenseNumber": "string", "expiryDate": "datetime", "status": "string", "createdAt": "datetime" }], "pageInfo": { ... } }` | 200, 401, 403 |
| POST   | `/api/admin/driver-licenses/{id}/approve` | Approve a pending driver license request.                            | -                                                                              | `{ "id": "guid", "status": "Approved" }`                                        | 200, 401, 403, 404              |
| POST   | `/api/admin/driver-licenses/{id}/reject` | Reject a pending driver license request.                              | `{ "reason": "string" }`                                                       | `{ "id": "guid", "status": "Rejected", "rejectionReason": "string" }`           | 200, 400, 401, 403, 404         |

#### Admin: Driver Management
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/admin/drivers`              | List/filter drivers for admin management.                                   | Query param: `status`                                                          | `[{ "id": "guid", "user": { "id": "guid", "firstName": "string", "lastName": "string", "email": "string" }, "licenseNumber": "string", "status": "string", "isAvailable": true }]` | 200, 401, 403 |
| GET    | `/api/admin/drivers/pending`      | Get pending driver approval queue.                                          | -                                                                              | `[{ "id": "guid", "user": { "id": "guid", "firstName": "string", "lastName": "string", "email": "string" }, "licenseNumber": "string", "profileImageUrl": "string" }]` | 200, 401, 403 |
| GET    | `/api/admin/drivers/{id}`         | Get driver details.                                                         | -                                                                              | `{ "id": "guid", "user": { ... }, "licenseNumber": "string", "licenseExpiryDate": "datetime", "profileImageUrl": "string", "isAvailable": true, "status": "string", "payoutInfo": { ... }, "earnings": 5000.00, "bookingsCount": 20 }` | 200, 401, 403, 404 |
| POST   | `/api/admin/drivers/{id}/approve` | Approve a driver.                                                           | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |
| POST   | `/api/admin/drivers/{id}/reject`  | Reject a driver.                                                            | `{ "reason": "string" }`                                                       | `{ "message": "string" }`                                                      | 200, 400, 401, 403, 404         |
| POST   | `/api/admin/drivers/{id}/enable`  | Enable a driver.                                                            | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |
| POST   | `/api/admin/drivers/{id}/disable` | Disable a driver.                                                           | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |

#### Admin: Driver Earnings
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/admin/driver-earnings/{driverProfileId}/overview` | Get earnings overview for a driver.                              | -                                                                              | `{ "totalEarnings": 5000.00, "availableBalance": 2000.00, "pendingBalance": 3000.00, "completedBookingsCount": 20 }` | 200, 401, 403 |
| GET    | `/api/admin/driver-earnings/pending-payouts` | Get pending payouts for admin approval.                              | -                                                                              | `[{ "id": "guid", "driver": { "id": "guid", "name": "string" }, "amount": 2000.00, "walletAddress": "string", "walletType": "string", "createdAt": "datetime" }]` | 200, 401, 403 |
| GET    | `/api/admin/driver-earnings/pending-verification` | Get pending wallet verifications.                                  | -                                                                              | `[{ "driverProfileId": "guid", "driverName": "string", "walletAddress": "string", "walletType": "string" }]` | 200, 401, 403 |
| POST   | `/api/admin/driver-earnings/{payoutId}/approve` | Approve a pending payout.                                          | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |
| POST   | `/api/admin/driver-earnings/{payoutId}/reject` | Reject a pending payout.                                            | `{ "reason": "string" }`                                                       | `{ "message": "string" }`                                                      | 200, 400, 401, 403, 404         |
| POST   | `/api/admin/driver-earnings/{payoutId}/retry` | Retry a failed payout.                                              | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |
| POST   | `/api/admin/driver-earnings/{driverProfileId}/verify-wallet` | Verify wallet information.                                  | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |
| GET    | `/api/admin/driver-earnings/{driverProfileId}/history` | Get earnings history for a driver.                                | Query params: `pageNumber`, `pageSize`                                         | `[{ "id": "guid", "bookingId": "guid", "bookingNumber": "string", "vehicle": { "make": "string", "model": "string" }, "amount": 250.00, "status": "string", "date": "datetime" }]` | 200, 401, 403 |
| GET    | `/api/admin/driver-earnings/platform-summary` | Get platform-wide driver earnings summary.                          | -                                                                              | `{ "totalDriverEarnings": 50000.00, "totalPayouts": 45000.00, "pendingPayouts": 5000.00, "driversCount": 100 }` | 200, 401, 403 |

#### Admin: Commission
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/admin/commission/global`    | Get global commission percentage.                                          | -                                                                              | `{ "percentage": 10.00 }`                                                      | 200, 401, 403                   |
| PUT    | `/api/admin/commission/global`    | Update global commission percentage.                                       | `{ "percentage": 10.00 }`                                                     | `{ "percentage": 10.00 }`                                                      | 200, 400, 401, 403              |
| GET    | `/api/admin/commission/driver`    | Get global driver commission percentage.                                   | -                                                                              | `{ "percentage": 15.00 }`                                                      | 200, 401, 403                   |
| PUT    | `/api/admin/commission/driver`    | Update global driver commission percentage.                                | `{ "percentage": 15.00 }`                                                     | `{ "percentage": 15.00 }`                                                      | 200, 400, 401, 403              |

#### Admin: Categories
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/categories`                 | Get all vehicle categories.                                                | -                                                                              | `[{ "id": "guid", "name": "string", "description": "string", "icon": "string", "vehicleCount": 10, "activeOffer": { "discountPercentage": 10.00, "endDate": "datetime" } }]` | 200 |
| POST   | `/api/categories`                 | Create a new vehicle category.                                              | `{ "name": "string", "description": "string", "icon": "string", "offerDiscountPercentage": 10.00, "offerEndDate": "datetime" }` | `{ "id": "guid", "message": "string" }` | 201, 400, 401, 403 |
| PUT    | `/api/categories/{id}`            | Update an existing vehicle category.                                        | `{ "name": "string", "description": "string", "icon": "string", "offerDiscountPercentage": 10.00, "offerEndDate": "datetime" }` | `{ "id": "guid", "message": "string" }` | 200, 400, 401, 403, 404 |
| DELETE | `/api/categories/{id}`            | Delete a vehicle category.                                                  | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |
| GET    | `/api/categories/{id}/details`    | Get category details with vehicles and revenue.                            | -                                                                              | `{ "id": "guid", "name": "string", "description": "string", "vehicleCount": 10, "bookingCount": 50, "revenue": 5000.00, "vehicles": [{ "id": "guid", "make": "string", "model": "string", "licensePlate": "string" }] }` | 200, 404 |
| POST   | `/api/categories/bulk-assign`     | Bulk assign vehicles to a category.                                         | `{ "categoryId": "guid", "vehicleIds": ["guid"] }`                            | `{ "message": "string", "assignedCount": 5 }`                                  | 200, 400, 401, 403              |

#### Admin: Suppliers
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/admin/suppliers`            | Get paginated list of suppliers.                                            | Query params: `page`, `size`                                                   | `{ "data": [{ "id": "guid", "businessName": "string", "businessEmail": "string", "businessPhone": "string", "status": "string", "createdAt": "datetime" }], "pageInfo": { ... } }` | 200, 401, 403 |
| GET    | `/api/admin/suppliers/{id}`       | Get supplier by ID.                                                         | -                                                                              | `{ "id": "guid", "businessName": "string", "businessEmail": "string", "businessPhone": "string", "taxId": "string", "commercialRegistrationNumber": "string", "status": "string", "user": { "id": "guid", "firstName": "string", "lastName": "string", "email": "string" }, "createdAt": "datetime" }` | 200, 401, 403, 404 |
| POST   | `/api/admin/suppliers`            | Create a new supplier account.                                              | `{ "email": "string", "password": "string", "firstName": "string", "lastName": "string", "businessName": "string", "businessEmail": "string", "businessPhone": "string", "taxId": "string", "commercialRegistrationNumber": "string" }` | `{ "supplierId": "guid", "message": "string" }` | 201, 400, 401, 403 |
| PUT    | `/api/admin/suppliers/{id}`       | Update an existing supplier account.                                        | `{ "firstName": "string", "lastName": "string", "businessName": "string", "businessEmail": "string", "businessPhone": "string", "taxId": "string", "commercialRegistrationNumber": "string", "status": "string" }` | `{ "message": "string" }` | 200, 400, 401, 403, 404 |
| DELETE | `/api/admin/suppliers/{id}`       | Delete a supplier account.                                                  | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |

#### Admin: Users
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/admin/users`                | Get paginated list of users.                                                | Query params: `page`, `size`, `search`, `role`, `status`                       | `{ "data": [{ "id": "guid", "firstName": "string", "lastName": "string", "email": "string", "phoneNumber": "string", "role": "string", "status": "string", "createdAt": "datetime" }], "pageInfo": { ... } }` | 200, 401, 403 |
| GET    | `/api/admin/users/{id}`           | Get user by ID.                                                             | -                                                                              | `{ "id": "guid", "firstName": "string", "lastName": "string", "email": "string", "phoneNumber": "string", "role": "string", "status": "string", "emailVerified": true, "createdAt": "datetime", "addresses": [{ ... }] }` | 200, 401, 403, 404 |
| POST   | `/api/admin/users`                | Create a new user account.                                                  | `{ "email": "string", "password": "string", "firstName": "string", "lastName": "string", "phoneNumber": "string", "role": "string" }` | `{ "userId": "guid", "message": "string" }` | 201, 400, 401, 403 |
| PUT    | `/api/admin/users/{id}`           | Update an existing user account.                                            | `{ "firstName": "string", "lastName": "string", "phoneNumber": "string", "role": "string", "status": "string" }` | `{ "message": "string" }` | 200, 400, 401, 403, 404 |
| POST   | `/api/admin/users/{id}/toggle-status` | Toggle user status between Active and Blocked.                         | -                                                                              | `{ "message": "string", "finalStatus": "string" }`                             | 200, 401, 403, 404              |
| POST   | `/api/admin/users/{id}/photo`     | Upload profile photo for a user.                                           | `multipart/form-data` (file)                                                   | `{ "photoUrl": "string" }`                                                     | 200, 400, 401, 403, 404         |
| DELETE | `/api/admin/users/{id}`           | Permanently delete a user.                                                  | -                                                                              | `{ "message": "string", "criticalRecords": ["string"] }`                       | 200, 400, 401, 403, 404         |

#### Admin: Inspectors
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/admin/inspectors`           | List all inspectors.                                                        | Query param: `activeOnly`                                                      | `[{ "id": "guid", "user": { "id": "guid", "firstName": "string", "lastName": "string", "email": "string" }, "isActive": true, "pendingInspections": 5 }]` | 200, 401, 403 |
| GET    | `/api/admin/inspectors/{id}`      | Get inspector details.                                                      | -                                                                              | `{ "id": "guid", "user": { ... }, "isActive": true, "pendingInspections": 5, "completedInspections": 20, "recentInspections": [{ "id": "guid", "bookingNumber": "string", "vehicle": { "make": "string", "model": "string" }, "status": "string", "createdAt": "datetime" }] }` | 200, 401, 403, 404 |
| POST   | `/api/admin/inspectors`           | Provision a new inspector.                                                  | `{ "email": "string", "firstName": "string", "lastName": "string" }`          | `{ "id": "guid", "message": "string" }`                                         | 201, 400, 401, 403              |
| PATCH  | `/api/admin/inspectors/{id}/status` | Enable/disable an inspector.                                               | `{ "isActive": true }`                                                         | `{ "id": "guid", "isActive": true }`                                            | 200, 400, 401, 403, 404         |

#### Admin: Booking Inspections
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| POST   | `/api/admin/booking-inspections/{bookingId}/assign` | Assign an inspector to a booking.                                | `{ "inspectorId": "guid" }`                                                    | `{ "id": "guid", "bookingId": "guid", "inspector": { "id": "guid", "name": "string" }, "status": "string" }` | 200, 400, 401, 403, 404 |

#### Inspector Dashboard
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/inspector/dashboard/today-stats` | Get today's KPI stats for the inspector dashboard.                  | -                                                                              | `{ "pendingTasks": 5, "completedTasks": 3, "rejectedTasks": 1 }`               | 200, 401, 403                   |
| GET    | `/api/inspector/dashboard/today-tasks` | Get today's enriched task list for the inspector dashboard.           | -                                                                              | `[{ "id": "guid", "bookingNumber": "string", "vehicle": { "make": "string", "model": "string", "licensePlate": "string", "imageUrl": "string" }, "customer": { "name": "string", "phoneNumber": "string" }, "pickupDate": "datetime", "status": "string" }]` | 200, 401, 403 |
| GET    | `/api/inspector/dashboard/{inspectionId}` | Get full details for one inspection.                                | -                                                                              | `{ "id": "guid", "bookingNumber": "string", "vehicle": { ... }, "customer": { ... }, "pickupDate": "datetime", "status": "string", "notes": "string", "odometerReading": 15000, "fuelLevel": "string", "vehicleCondition": "string", "images": ["string"] }` | 200, 401, 403, 404 |
| PUT    | `/api/inspector/dashboard/{inspectionId}` | Update notes, odometer, fuel, or condition on the draft.            | `{ "notes": "string", "odometerReading": 15000, "fuelLevel": "string", "vehicleCondition": "string" }` | `{ "id": "guid", "notes": "string", "odometerReading": 15000, "fuelLevel": "string", "vehicleCondition": "string" }` | 200, 400, 401, 403, 404 |
| POST   | `/api/inspector/dashboard/{inspectionId}/images` | Attach an image URL to the inspection.                              | `{ "imageUrl": "string" }`                                                     | `{ "id": "guid", "imageUrl": "string" }`                                        | 200, 400, 401, 403, 404         |
| POST   | `/api/inspector/dashboard/{inspectionId}/upload-images` | Upload raw image files for the inspection.                          | `multipart/form-data` (files)                                                  | `[{ "id": "guid", "imageUrl": "string" }]`                                      | 200, 400, 401, 403, 404         |
| POST   | `/api/inspector/dashboard/{inspectionId}/submit` | Submit the inspection (approve/reject).                              | `{ "approve": true, "notes": "string" }`                                       | `{ "id": "guid", "status": "string" }`                                          | 200, 400, 401, 403, 404         |
| GET    | `/api/inspector/dashboard/history` | Get submitted inspection history.                                       | -                                                                              | `[{ "id": "guid", "bookingNumber": "string", "vehicle": { "make": "string", "model": "string" }, "status": "string", "createdAt": "datetime" }]` | 200, 401, 403 |

#### Dashboard
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/dashboard/summary`          | Get dashboard summary statistics.                                          | -                                                                              | `{ "totalUsers": 1000, "totalVehicles": 200, "totalBookings": 500, "totalRevenue": 50000.00, "pendingVerifications": 10, "pendingInspections": 5 }` | 200, 401, 403 |
| GET    | `/api/dashboard/recent-summary`   | Get recent activity summary.                                                | -                                                                              | `[{ "type": "string", "title": "string", "description": "string", "timestamp": "datetime" }]` | 200, 401, 403 |
| GET    | `/api/dashboard/recent-bookings`  | Get recent bookings.                                                        | Query param: `limit`                                                           | `[{ "id": "guid", "bookingNumber": "string", "vehicle": { "make": "string", "model": "string" }, "customer": { "name": "string" }, "pickupDate": "datetime", "status": "string", "totalPrice": 600.00 }]` | 200, 401, 403 |
| GET    | `/api/dashboard/upcoming-bookings`| Get upcoming bookings.                                                      | Query param: `days`                                                            | `[{ "id": "guid", "bookingNumber": "string", "vehicle": { "make": "string", "model": "string" }, "customer": { "name": "string" }, "pickupDate": "datetime", "status": "string" }]` | 200, 401, 403 |
| GET    | `/api/dashboard/revenue-week`     | Get revenue data for the past week.                                         | -                                                                              | `[{ "date": "datetime", "revenue": 1000.00 }]`                                  | 200, 401, 403                   |
| GET    | `/api/dashboard/live-tracking`    | Get live tracking data for active bookings.                                 | -                                                                              | `{ "activeBookings": 30, "locations": [{ "bookingId": "guid", "latitude": 30.0444, "longitude": 31.2357 }] }` | 200, 401, 403 |
| GET    | `/api/dashboard/system-status`    | Get system status.                                                          | -                                                                              | `{ "database": "healthy", "emailService": "healthy", "paymentGateway": "healthy" }` | 200, 401, 403 |
| GET    | `/api/dashboard/top-vehicles`     | Get top vehicles by bookings/revenue.                                       | Query param: `limit`                                                           | `[{ "id": "guid", "make": "string", "model": "string", "bookingsCount": 50, "revenue": 5000.00 }]` | 200, 401, 403 |
| GET    | `/api/dashboard/revenue-overview` | Get revenue overview.                                                       | Query param: `filter` (ThisMonth, LastMonth, ThisYear, LastYear)               | `{ "currentPeriod": { "revenue": 5000.00, "bookings": 50 }, "previousPeriod": { "revenue": 4000.00, "bookings": 40 }, "growthPercentage": 25.00 }` | 200, 401, 403 |

#### Supplier Dashboard
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/supplier/dashboard/stats`   | Get headline stats for the supplier dashboard.                             | -                                                                              | `{ "totalVehicles": 10, "pendingVehicles": 2, "activeBookings": 5, "totalEarnings": 5000.00 }` | 200, 401, 403 |
| GET    | `/api/supplier/dashboard/bookings-by-status` | Get booking counts by status.                                       | -                                                                              | `{ "pending": 2, "confirmed": 5, "active": 3, "completed": 10, "cancelled": 1 }` | 200, 401, 403 |

#### Locations
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/locations/autocomplete`     | Get location autocomplete suggestions.                                     | Query params: `query`, `type`                                                  | `["Cairo", "Giza", "Alexandria"]`                                               | 200, 400                        |
| GET    | `/api/locations`                  | Get paginated locations.                                                    | Query params: `page`, `size`, `s`                                              | `{ "data": [{ "id": "guid", "address": "string" }], "pageInfo": { ... } }`      | 200                              |
| POST   | `/api/locations`                  | Create a new location (Admin only).                                         | `{ "addressLine1": "string", "addressLine2": "string", "city": "string", "governorate": "string", "country": "string", "postalCode": "string", "latitude": 30.0444, "longitude": 31.2357 }` | `{ "id": "guid", "message": "string" }` | 201, 400, 401, 403 |
| PUT    | `/api/locations/{id}`             | Update an existing location (Admin only).                                   | `{ "addressLine1": "string", "addressLine2": "string", "city": "string", "governorate": "string", "country": "string", "postalCode": "string", "latitude": 30.0444, "longitude": 31.2357 }` | `{ "id": "guid", "message": "string" }` | 200, 400, 401, 403, 404 |
| GET    | `/api/locations/{id}`             | Get location by ID (Admin only).                                            | -                                                                              | `{ "id": "guid", "addressLine1": "string", "addressLine2": "string", "city": "string", "governorate": "string", "country": "string", "postalCode": "string", "latitude": 30.0444, "longitude": 31.2357 }` | 200, 401, 403, 404 |
| DELETE | `/api/locations/{id}`             | Delete a location (Admin only).                                             | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |

#### Service Areas
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/service-areas`              | Get all service areas.                                                      | -                                                                              | `[{ "id": "guid", "city": "string", "governorate": "string", "country": "string" }]` | 200                              |
| POST   | `/api/service-areas`              | Create a new service area (Admin only).                                     | `{ "city": "string", "governorate": "string", "country": "string" }`          | `{ "id": "guid", "message": "string" }`                                         | 201, 400, 401, 403              |
| PUT    | `/api/service-areas/{id}`         | Update an existing service area (Admin only).                               | `{ "city": "string", "governorate": "string", "country": "string" }`          | `{ "id": "guid", "message": "string" }`                                         | 200, 400, 401, 403, 404         |
| DELETE | `/api/service-areas/{id}`         | Delete a service area (Admin only).                                         | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |

#### Public Information
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/public/landing`             | Get landing page content.                                                   | -                                                                              | `{ "hero": { "title": "string", "subtitle": "string", "imageUrl": "string" }, "valueProps": [{ "title": "string", "description": "string", "icon": "string" }], "featuredCategories": [{ "id": "guid", "name": "string", "imageUrl": "string" }], "popularDestinations": [{ "id": "guid", "name": "string", "imageUrl": "string" }], "faq": [{ "question": "string", "answer": "string" }], "support": { "title": "string", "description": "string", "icon": "string" } }` | 200 |
| GET    | `/api/public/suppliers`           | Get paginated list of public suppliers.                                     | Query params: `page`, `size`                                                   | `{ "data": [{ "id": "guid", "businessName": "string", "businessEmail": "string", "businessPhone": "string", "rating": 4.5, "vehicleCount": 10, "imageUrl": "string" }], "pageInfo": { ... } }` | 200 |
| GET    | `/api/public/suppliers/{id}`      | Get public supplier details.                                                | -                                                                              | `{ "id": "guid", "businessName": "string", "businessEmail": "string", "businessPhone": "string", "description": "string", "rating": 4.5, "vehicleCount": 10, "imageUrl": "string", "vehicles": [{ "id": "guid", "make": "string", "model": "string", "year": 2022, "dailyRate": 100.00, "imageUrl": "string" }] }` | 200, 404 |
| GET    | `/api/public/destinations/popular`| Get popular destinations.                                                   | Query param: `limit`                                                           | `[{ "id": "guid", "name": "string", "imageUrl": "string" }]`                    | 200                              |

#### About, Privacy, Terms
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/about`                      | Get all about sections.                                                     | Query params: `locale`, `includeLocalizations`                                | `[{ "id": "guid", "title": "string", "content": "string", "order": 1 }]`        | 200                              |
| GET    | `/api/about/{id}`                 | Get about section by ID.                                                    | Query param: `locale`                                                          | `{ "id": "guid", "title": "string", "content": "string", "order": 1 }`          | 200, 404                         |
| POST   | `/api/about`                      | Create a new about section (Admin only).                                    | `{ "title": "string", "content": "string", "order": 1 }`                       | `{ "id": "guid", "message": "string" }`                                         | 201, 400, 401, 403              |
| PUT    | `/api/about/{id}`                 | Update an about section (Admin only).                                       | `{ "title": "string", "content": "string", "order": 1 }`                       | `{ "id": "guid", "message": "string" }`                                         | 200, 400, 401, 403, 404         |
| DELETE | `/api/about/{id}`                 | Delete an about section (Admin only).                                       | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |
| GET    | `/api/privacy`                    | Get all privacy sections.                                                   | Query params: `locale`, `includeLocalizations`                                | `[{ "id": "guid", "title": "string", "content": "string", "order": 1 }]`        | 200                              |
| GET    | `/api/privacy/{id}`               | Get privacy section by ID.                                                  | Query param: `locale`                                                          | `{ "id": "guid", "title": "string", "content": "string", "order": 1 }`          | 200, 404                         |
| POST   | `/api/privacy`                    | Create a new privacy section (Admin only).                                  | `{ "title": "string", "content": "string", "order": 1 }`                       | `{ "id": "guid", "message": "string" }`                                         | 201, 400, 401, 403              |
| PUT    | `/api/privacy/{id}`               | Update a privacy section (Admin only).                                      | `{ "title": "string", "content": "string", "order": 1 }`                       | `{ "id": "guid", "message": "string" }`                                         | 200, 400, 401, 403, 404         |
| DELETE | `/api/privacy/{id}`               | Delete a privacy section (Admin only).                                      | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |
| GET    | `/api/terms`                      | Get all terms sections.                                                     | Query params: `locale`, `includeLocalizations`                                | `[{ "id": "guid", "title": "string", "content": "string", "order": 1 }]`        | 200                              |
| GET    | `/api/terms/{id}`                 | Get terms section by ID.                                                    | Query param: `locale`                                                          | `{ "id": "guid", "title": "string", "content": "string", "order": 1 }`          | 200, 404                         |
| POST   | `/api/terms`                      | Create a new terms section (Admin only).                                    | `{ "title": "string", "content": "string", "order": 1 }`                       | `{ "id": "guid", "message": "string" }`                                         | 201, 400, 401, 403              |
| PUT    | `/api/terms/{id}`                 | Update a terms section (Admin only).                                        | `{ "title": "string", "content": "string", "order": 1 }`                       | `{ "id": "guid", "message": "string" }`                                         | 200, 400, 401, 403, 404         |
| DELETE | `/api/terms/{id}`                 | Delete a terms section (Admin only).                                        | -                                                                              | `{ "message": "string" }`                                                      | 200, 401, 403, 404              |

#### Health Check
| Method | Endpoint                          | Description                                                                 | Payload Format                                                                 | Response Format                                                                 | Status Codes                     |
|--------|-----------------------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------------------------------------------------------------------------------|----------------------------------|
| GET    | `/api/health`                     | Basic health check endpoint.                                                | -                                                                              | `{ "status": "healthy", "timestamp": "datetime", "version": "string" }`        | 200                              |
| GET    | `/api/health/detailed`            | Detailed health check with component status.                                | -                                                                              | `{ "status": "healthy", "timestamp": "datetime", "version": "string", "components": { "api": "healthy", "database": "healthy" } }` | 200, 503 |

---

### Request/Response Examples
Below are detailed request and response examples for key endpoints.

#### 1. User Registration
**Request**:
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "acceptedTerms": true,
  "acceptedPrivacy": true
}
```

**Response (201 Created)**:
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john.doe@example.com",
  "emailVerified": false
}
```

**Response (400 Bad Request)**:
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "Password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    }
  ]
}
```

---

#### 2. User Login
**Request**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "stayConnected": false
}
```

**Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2023-10-02T12:00:00Z",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["Customer"],
    "emailVerified": true
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "message": "Invalid credentials"
}
```

---

#### 3. Search Vehicles
**Request**:
```http
GET /api/vehicles/search?pickupLocationId=123e4567-e89b-12d3-a456-426614174001&returnLocationId=123e4567-e89b-12d3-a456-426614174001&pickupDate=2023-10-15T09:00:00Z&returnDate=2023-10-20T18:00:00Z&category=Sedan&transmission=Automatic&minPrice=50&maxPrice=200&sortBy=price&page=1&limit=10
```

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174010",
      "make": "Toyota",
      "model": "Camry",
      "year": 2022,
      "dailyRate": 100.00,
      "hourlyRate": 20.00,
      "imageUrl": "https://ares-car-rental.s3.amazonaws.com/vehicles/toyota-camry-front.jpg",
      "rating": 4.5,
      "seats": 5,
      "transmission": "Automatic",
      "fuelType": "Petrol"
    }
  ],
  "pageInfo": {
    "totalRecords": 1,
    "totalPages": 1,
    "currentPage": 1,
    "pageSize": 10
  }
}
```

---

#### 4. Create Booking
**Request**:
```http
POST /api/bookings
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "vehicleId": "123e4567-e89b-12d3-a456-426614174010",
  "pickupLocationId": "123e4567-e89b-12d3-a456-426614174001",
  "returnLocationId": "123e4567-e89b-12d3-a456-426614174001",
  "pickupDate": "2023-10-15T09:00:00Z",
  "returnDate": "2023-10-20T18:00:00Z",
  "customerId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response (201 Created)**:
```json
{
  "bookingId": "123e4567-e89b-12d3-a456-426614174014",
  "bookingNumber": "BKG-2023-1001",
  "status": "Pending",
  "totalPrice": 600.00
}
```

---

#### 5. Get Booking Details
**Request**:
```http
GET /api/bookings/123e4567-e89b-12d3-a456-426614174014
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174014",
  "bookingNumber": "BKG-2023-1001",
  "vehicle": {
    "id": "123e4567-e89b-12d3-a456-426614174010",
    "make": "Toyota",
    "model": "Camry",
    "year": 2022,
    "licensePlate": "ABC123",
    "imageUrl": "https://ares-car-rental.s3.amazonaws.com/vehicles/toyota-camry-front.jpg"
  },
  "customer": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890"
  },
  "driver": {
    "id": "123e4567-e89b-12d3-a456-426614174004",
    "name": "Jane Smith",
    "profileImageUrl": "https://ares-car-rental.s3.amazonaws.com/profiles/driver.jpg",
    "rating": 4.8
  },
  "pickupLocation": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B",
    "city": "Cairo",
    "governorate": "Cairo",
    "country": "Egypt"
  },
  "returnLocation": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B",
    "city": "Cairo",
    "governorate": "Cairo",
    "country": "Egypt"
  },
  "pickupDate": "2023-10-15T09:00:00Z",
  "returnDate": "2023-10-20T18:00:00Z",
  "status": "Confirmed",
  "totalPrice": 600.00,
  "payment": {
    "id": "123e4567-e89b-12d3-a456-426614174016",
    "transactionId": "PAY-1234567890",
    "amount": 600.00,
    "status": "Captured",
    "paymentMethod": "CreditCard"
  },
  "inspection": {
    "id": "123e4567-e89b-12d3-a456-426614174020",
    "status": "Approved",
    "notes": "No visible damage. Vehicle is clean and well-maintained.",
    "odometerReading": 15000,
    "fuelLevel": "Full",
    "vehicleCondition": "Good"
  },
  "canCancel": true,
  "refundAmount": 540.00
}
```

---

#### 6. Checkout Flow
**Step 1: Create Draft Booking**
**Request**:
```http
POST /api/checkout/draft
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "vehicleId": "123e4567-e89b-12d3-a456-426614174010",
  "pickupLocationId": "123e4567-e89b-12d3-a456-426614174001",
  "returnLocationId": "123e4567-e89b-12d3-a456-426614174001",
  "pickupDate": "2023-10-15T09:00:00Z",
  "returnDate": "2023-10-20T18:00:00Z"
}
```

**Response (200 OK)**:
```json
{
  "bookingId": "123e4567-e89b-12d3-a456-426614174014",
  "state": "Draft"
}
```

**Step 2: Select Driver**
**Request**:
```http
POST /api/checkout/driver
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "bookingId": "123e4567-e89b-12d3-a456-426614174014",
  "driverProfileId": "123e4567-e89b-12d3-a456-426614174004"
}
```

**Response (200 OK)**:
```json
{
  "bookingId": "123e4567-e89b-12d3-a456-426614174014",
  "state": "DriverSelected"
}
```

**Step 3: Begin Payment**
**Request**:
```http
POST /api/checkout/payment
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "bookingId": "123e4567-e89b-12d3-a456-426614174014"
}
```

**Response (200 OK)**:
```json
{
  "bookingId": "123e4567-e89b-12d3-a456-426614174014",
  "state": "PaymentPending",
  "paymentIntentId": "pi_1234567890"
}
```

**Step 4: Confirm Checkout**
**Request**:
```http
POST /api/checkout/confirm
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "bookingId": "123e4567-e89b-12d3-a456-426614174014",
  "paymentIntentId": "pi_1234567890"
}
```

**Response (200 OK)**:
```json
{
  "bookingId": "123e4567-e89b-12d3-a456-426614174014",
  "bookingNumber": "BKG-2023-1001",
  "status": "Confirmed"
}
```

---

## 3.6 Technology Stack Justification

The technology stack for the Ares Car Rental system is carefully selected to meet the project's functional and non-functional requirements while ensuring scalability, maintainability, and performance. Below is a justification for each major technology choice.

### Frontend: Next.js
- **Justification**:
  - **Server-Side Rendering (SSR)**: Next.js enables SSR, which is crucial for SEO and improving the initial load performance of the booking portal. This ensures that search engines can index vehicle listings and public pages effectively.
  - **React-Based**: Leverages the React ecosystem, providing a rich set of libraries and tools for building dynamic and responsive user interfaces.
  - **Hybrid Rendering**: Supports both static site generation (SSG) and SSR, allowing for flexible rendering strategies based on content requirements.
  - **File-Based Routing**: Simplifies the creation of routes, reducing boilerplate code and improving developer productivity.
  - **API Routes**: Enables the creation of backend endpoints within the Next.js application, useful for small-scale or prototype features.
  - **TypeScript Support**: Strong typing with TypeScript reduces runtime errors and improves code maintainability.
  - **Material-UI (MUI)**: Provides a comprehensive, customizable, and responsive UI component library that adheres to Google's Material Design principles, ensuring a consistent and professional look and feel.

### Backend: .NET Core
- **Justification**:
  - **Enterprise-Grade Performance**: .NET Core is known for its high performance and scalability, making it suitable for handling the complex business logic and high traffic expected in a car rental system.
  - **Cross-Platform**: Runs on Windows, Linux, and macOS, providing flexibility in deployment environments.
  - **Seamless SQL Server Integration**: Native support for SQL Server ensures efficient data access and management, which is critical for financial transactions and reporting.
  - **Dependency Injection**: Built-in DI container simplifies the management of dependencies, promoting modularity and testability.
  - **Entity Framework Core**: ORM for data access, reducing boilerplate code and improving developer productivity.
  - **Security**: Comprehensive security features, including built-in support for authentication, authorization, and data protection.
  - **Swagger/OpenAPI**: Integrated support for API documentation, making it easier for frontend developers to consume the API.
  - **FluentValidation**: Simplifies request validation, ensuring data integrity and reducing boilerplate code.

### Database: SQL Server
- **Justification**:
  - **ACID Compliance**: Ensures data integrity, which is essential for financial transactions (e.g., payments, refunds) and booking management.
  - **Scalability**: Supports vertical and horizontal scaling, allowing the system to handle increased load as the user base grows.
  - **Seamless Integration with .NET Core**: Native support in Entity Framework Core simplifies data access and reduces development time.
  - **Advanced Querying**: Supports complex queries and stored procedures, enabling efficient reporting and analytics.
  - **Security**: Robust security features, including encryption at rest and in transit, role-based access control, and auditing.
  - **High Availability**: Supports failover clustering and Always On availability groups, ensuring minimal downtime.

### Infrastructure: Docker and Kubernetes
- **Justification**:
  - **Docker**:
    - **Containerization**: Packages the application and its dependencies into isolated containers, ensuring consistency across development, testing, and production environments.
    - **Portability**: Containers can run on any system that supports Docker, reducing "works on my machine" issues.
    - **Resource Efficiency**: Lightweight compared to virtual machines, allowing for higher density and better resource utilization.
  - **Kubernetes**:
    - **Scalability**: Automatically scales the application based on demand, ensuring optimal performance during peak usage periods.
    - **Self-Healing**: Automatically restarts failed containers, replaces containers, and reschedules them on healthy nodes.
    - **Load Balancing**: Distributes network traffic to ensure stable and efficient application performance.
    - **Declarative Configuration**: Uses YAML files to define the desired state of the application, simplifying deployment and management.
    - **Reproducible Deployments**: Ensures consistent deployments across different environments, reducing configuration drift.

### External Services
1. **AWS SES (Simple Email Service)**:
   - **Justification**: Reliable and scalable email service for sending transactional emails (e.g., booking confirmations, password resets). SES provides high deliverability rates and integrates seamlessly with .NET Core.

2. **AWS S3 (Simple Storage Service)**:
   - **Justification**: Scalable and durable object storage for user-uploaded files (e.g., vehicle images, driver licenses). S3 provides high availability, security, and cost-effective storage options.

3. **Payment Gateway (Paymob)**:
   - **Justification**: Secure and reliable payment processing for credit card transactions. Paymob supports multiple payment methods, fraud detection, and seamless integration with the backend via webhooks.

---

## 3.7 Architecture Decision Records (ADRs)

This section documents the critical architectural decisions made during the design and development of the Ares Car Rental system, along with their rationale.

### 1. JWT Authentication
- **Decision**: Use JWT (JSON Web Tokens) for authentication.
- **Rationale**:
  - **Lightweight**: JWTs are compact and can be sent via URL, POST parameter, or HTTP header.
  - **Stateless**: Eliminates the need for server-side session storage, improving scalability.
  - **Scalable**: Suitable for RESTful APIs, where each request is independent.
  - **Security**: Supports signing and encryption, ensuring data integrity and confidentiality.
  - **Flexibility**: Can include custom claims (e.g., user roles, permissions) for fine-grained access control.
  - **Standard**: Widely adopted and supported by numerous libraries and frameworks.

### 2. RESTful API over GraphQL
- **Decision**: Use RESTful APIs instead of GraphQL.
- **Rationale**:
  - **Simplicity**: REST is simpler to implement and understand, especially for a team of moderate size.
  - **Tooling**: Better tooling support for REST (e.g., Swagger/OpenAPI for documentation, Postman for testing).
  - **Caching**: REST APIs are easier to cache at the HTTP level (e.g., using CDNs or reverse proxies).
  - **Performance**: REST is generally more performant for simple CRUD operations, which constitute the majority of the system's API calls.
  - **Overfetching/Underfetching**: While GraphQL addresses these issues, REST can mitigate them through well-designed endpoints and query parameters.
  - **Learning Curve**: The team is more familiar with REST, reducing the risk of implementation errors.

### 3. SOLID Principles
- **Decision**: Adhere to SOLID principles in backend development.
- **Rationale**:
  - **Maintainability**: SOLID principles promote code that is easier to understand, modify, and extend.
  - **Extensibility**: Encourages the creation of modular components that can be extended without modifying existing code.
  - **Testability**: Code that follows SOLID principles is easier to unit test, improving code quality.
  - **Single Responsibility Principle (SRP)**: Ensures that each class has a single responsibility, reducing complexity.
  - **Open/Closed Principle (OCP)**: Allows for extension without modification, reducing the risk of introducing bugs.
  - **Liskov Substitution Principle (LSP)**: Ensures that derived classes can substitute their base classes, promoting polymorphism.
  - **Interface Segregation Principle (ISP)**: Encourages small, focused interfaces, reducing coupling.
  - **Dependency Inversion Principle (DIP)**: Promotes loose coupling by depending on abstractions rather than concrete implementations.

### 4. Monolithic Architecture over Microservices
- **Decision**: Use a monolithic architecture with clean layers instead of microservices.
- **Rationale**:
  - **Simplicity**: Easier to develop, test, and deploy, especially for a graduation project with limited resources.
  - **Performance**: Lower latency due to in-process communication between components.
  - **Transaction Management**: Simpler to manage transactions across multiple operations (e.g., booking creation and payment processing).
  - **Development Speed**: Faster development cycle, as there is no need to manage multiple services and their interactions.
  - **Team Size**: Suitable for a small team, where the overhead of microservices would outweigh the benefits.
  - **Future Extensibility**: The monolith can be modularized and split into microservices later if needed, using techniques like the **Strangler Pattern**.

### 5. UTC Time for Backend
- **Decision**: Use UTC for all timestamps in the backend.
- **Rationale**:
  - **Consistency**: Ensures consistent time representation across different time zones.
  - **Daylight Saving Time**: Avoids issues related to daylight saving time changes, which can cause confusion and bugs in booking calculations.
  - **Global Operations**: Facilitates operations in multiple time zones, as UTC is the standard for global timekeeping.
  - **Simplification**: Reduces complexity in date/time calculations and comparisons.

### 6. Layered Architecture
- **Decision**: Use a layered architecture (Presentation, Application, Domain, Infrastructure).
- **Rationale**:
  - **Separation of Concerns**: Each layer has a distinct responsibility, improving modularity and maintainability.
  - **Testability**: Layers can be tested independently, improving code quality.
  - **Flexibility**: Layers can be modified or replaced without affecting other layers (e.g., switching databases or frontend frameworks).
  - **Scalability**: Each layer can be scaled independently based on demand.

### 7. Repository Pattern
- **Decision**: Use the Repository Pattern for data access.
- **Rationale**:
  - **Abstraction**: Hides the details of data access, making the code more maintainable and testable.
  - **Centralization**: Provides a single place to manage data access logic, reducing duplication.
  - **Mockability**: Repositories can be easily mocked for unit testing, improving test coverage.
  - **Flexibility**: Allows for switching data sources (e.g., from SQL Server to a NoSQL database) without affecting business logic.

### 8. Entity Framework Core
- **Decision**: Use Entity Framework Core as the ORM.
- **Rationale**:
  - **Productivity**: Reduces boilerplate code for data access, improving developer productivity.
  - **LINQ Support**: Enables type-safe queries using LINQ, reducing runtime errors.
  - **Migrations**: Simplifies database schema management and versioning.
  - **Performance**: Supports optimized queries and caching, ensuring efficient data access.
  - **Integration**: Seamless integration with SQL Server and .NET Core.

### 9. Docker and Kubernetes
- **Decision**: Use Docker for containerization and Kubernetes for orchestration.
- **Rationale**:
  - **Consistency**: Ensures consistent environments across development, testing, and production.
  - **Isolation**: Containers provide isolation, reducing conflicts between dependencies.
  - **Scalability**: Kubernetes enables horizontal scaling, ensuring the system can handle increased load.
  - **Self-Healing**: Kubernetes automatically restarts failed containers, improving system reliability.
  - **Portability**: Containers can run on any system that supports Docker, reducing deployment issues.

### 10. AWS SES and S3
- **Decision**: Use AWS SES for email and AWS S3 for file storage.
- **Rationale**:
  - **Scalability**: Both services are highly scalable, capable of handling increased load without manual intervention.
  - **Reliability**: AWS provides high availability and durability, ensuring that emails and files are delivered and stored reliably.
  - **Security**: Both services offer robust security features, including encryption and access control.
  - **Cost-Effectiveness**: Pay-as-you-go pricing models ensure cost efficiency, especially for a growing system.
  - **Integration**: Seamless integration with .NET Core via AWS SDKs.

### 11. Paymob Payment Gateway
- **Decision**: Use Paymob as the payment gateway.
- **Rationale**:
  - **Security**: PCI-DSS compliant, ensuring secure handling of credit card information.
  - **Multiple Payment Methods**: Supports credit cards, mobile wallets, and other payment methods.
  - **Fraud Detection**: Built-in fraud detection and prevention mechanisms.
  - **Webhooks**: Provides real-time updates on payment status via webhooks, ensuring accurate transaction tracking.
  - **Regional Support**: Strong presence in the Middle East and Africa, aligning with the target market.

### 12. Rate Limiting
- **Decision**: Implement rate limiting for authentication and sensitive endpoints.
- **Rationale**:
  - **Security**: Protects against brute-force attacks (e.g., password guessing).
  - **Stability**: Prevents abuse and ensures fair usage of system resources.
  - **Compliance**: Meets security best practices and regulatory requirements.

### 13. Global Exception Handling
- **Decision**: Implement global exception handling middleware.
- **Rationale**:
  - **Consistency**: Ensures consistent error responses across the API.
  - **Maintainability**: Centralizes error handling logic, reducing duplication.
  - **Security**: Prevents sensitive information from being exposed in error responses.
  - **Logging**: Enables centralized logging of errors, aiding in debugging and monitoring.

### 14. FluentValidation
- **Decision**: Use FluentValidation for request validation.
- **Rationale**:
  - **Readability**: Provides a fluent and expressive API for defining validation rules.
  - **Separation of Concerns**: Keeps validation logic separate from business logic, improving code organization.
  - **Reusability**: Validation rules can be reused across different endpoints.
  - **Integration**: Seamless integration with ASP.NET Core, enabling automatic validation of incoming requests.

### 15. AutoMapper
- **Decision**: Use AutoMapper for mapping between DTOs and domain entities.
- **Rationale**:
  - **Productivity**: Reduces boilerplate code for mapping objects, improving developer productivity.
  - **Maintainability**: Centralizes mapping logic, making it easier to update when domain models or DTOs change.
  - **Flexibility**: Supports complex mapping scenarios, including custom value resolvers and type converters.

---

## 3.8 Key Algorithms and Workflows

This section describes the key algorithms and workflows implemented in the Ares Car Rental system, focusing on their architectural and implementation significance. Flowcharts are provided using **Mermaid syntax** to visualize the workflows.

### 1. Booking Checkout Workflow
The **Booking Checkout Workflow** is a multi-step process that ensures a smooth and atomic booking creation, preventing double bookings and ensuring payment success. The workflow consists of the following states:
1. **Draft**: Initial state where the vehicle and rental window are selected.
2. **DriverSelected**: Driver is selected (if required).
3. **PaymentPending**: Payment is initiated, and the vehicle is temporarily held.
4. **Confirmed**: Payment is captured, and the booking is finalized.
5. **Cancelled**: Checkout is cancelled, and any holds are released.

#### Algorithm Steps:
1. **Create Draft Booking**:
   - Validate the vehicle and rental window.
   - Create a `Booking` record with `Status = Pending`.
   - Create a `BookingCheckoutState` record with `State = Draft`.
   - Return the `bookingId` to the client.

2. **Select Driver**:
   - Validate that the driver is available for the rental window.
   - Update the `BookingCheckoutState` record with `State = DriverSelected` and the `SelectedDriverId`.
   - Return the updated state to the client.

3. **Begin Payment**:
   - Validate that the booking is in the `DriverSelected` state.
   - Initiate payment with the payment gateway (e.g., Paymob).
   - Update the `BookingCheckoutState` record with `State = PaymentPending` and the `PaymentIntentId`.
   - Return the payment intent details to the client.

4. **Confirm Checkout**:
   - Validate that the booking is in the `PaymentPending` state.
   - Capture the payment using the `PaymentIntentId`.
   - Update the `Booking` record with `Status = Confirmed`.
   - Update the `BookingCheckoutState` record with `State = Confirmed`.
   - Create a `Payment` record with `Status = Captured`.
   - Send a booking confirmation email via AWS SES.
   - Return the booking details to the client.

5. **Cancel Checkout**:
   - Validate that the booking is not in the `Confirmed` state.
   - Cancel the payment intent (if applicable).
   - Update the `BookingCheckoutState` record with `State = Cancelled`.
   - Delete the `Booking` record (if it exists).
   - Return the updated state to the client.

#### Workflow Diagram:
```mermaid
quadrantChart
  title Syntax Error Test
  x-axis Low Risk --> High
  y-axis Low Value --> High Value
  quadrant-1[Label]_BAD
  Critical: [1, 2]
```

**Figure 3.8.a**: Booking workflow showing checkout algorithm and error handling.

---

### 2. Image Upload Pipeline
The **Image Upload Pipeline** handles the upload, processing, and storage of images (e.g., vehicle images, driver licenses). The pipeline ensures that images are resized, compressed, and stored securely in AWS S3.

#### Algorithm Steps:
1. **Upload Image**:
   - Receive the image file via `multipart/form-data`.
   - Validate the file size (e.g., max 10MB) and format (e.g., JPEG, PNG).
   - Generate a unique filename to prevent overwrites and ensure security.

2. **Process Image**:
   - Resize the image to multiple dimensions (e.g., thumbnail, medium, large) for responsive display.
   - Compress the image to reduce file size while maintaining quality.

3. **Upload to AWS S3**:
   - Upload the processed images to AWS S3.
   - Generate a public URL for each image.

4. **Persist URL**:
   - Save the image URLs to the database (e.g., `VehicleImage`, `DriverLicense`).
   - Return the image URLs to the client.

#### Workflow Diagram:
```mermaid
quadrantChart
  title Syntax Error Test
  x-axis Low Risk --> High
  y-axis Low Value --> High Value
  quadrant-1[Label]_BAD
  Critical: [1, 2]
```

**Figure 3.8.b**: Image upload pipeline showing processing steps.

---

### 3. Notification System
The **Notification System** sends transactional notifications to users via email (AWS SES) and in-app notifications. Notifications are triggered by specific events (e.g., booking confirmation, payment received).

#### Algorithm Steps:
1. **Trigger Event**:
   - An event occurs (e.g., booking confirmed, payment received).
   - The corresponding service (e.g., `BookingService`, `PaymentService`) publishes an event (e.g., `BookingConfirmedEvent`).

2. **Generate Notification**:
   - The `NotificationService` listens for events and generates a notification record in the database.
   - The notification includes a title, message, type, and recipient.

3. **Send Email (Optional)**:
   - If the notification type requires an email (e.g., booking confirmation), the `EmailService` sends an email via AWS SES.
   - The email uses a predefined template with dynamic content (e.g., booking details).

4. **Deliver In-App Notification**:
   - The frontend periodically polls the `/api/notifications` endpoint to fetch new notifications.
   - Unread notifications are displayed in the user's notification center.

#### Workflow Diagram:
```mermaid
quadrantChart
  title Syntax Error Test
  x-axis Low Risk --> High
  y-axis Low Value --> High Value
  quadrant-1[Label]_BAD
  Critical: [1, 2]
```

**Figure 3.8.c**: Notification system showing event-driven workflow.

---

### 4. Driver Assignment Algorithm
The **Driver Assignment Algorithm** matches available drivers to bookings based on proximity, availability, and driver preferences. The algorithm ensures that drivers are assigned fairly and efficiently.

#### Algorithm Steps:
1. **Filter Available Drivers**:
   - Query the `DriverProfile` table for drivers where `IsAvailable = true` and `Status = Approved`.
   - Filter drivers based on their service area (e.g., city, governorate).

2. **Check Availability Window**:
   - For each driver, check their `DriverEarning` records to ensure they are not already assigned to a booking that overlaps with the rental window.

3. **Calculate Proximity**:
   - Calculate the distance between the driver's last known location and the pickup location using the Haversine formula.
   - Filter drivers within a reasonable distance (e.g., 20 km).

4. **Select Driver**:
   - Sort drivers by proximity and rating.
   - Select the top driver and assign them to the booking.
   - Create a `Booking` record with the `DriverId` and update the `BookingCheckoutState` to `DriverSelected`.

5. **Notify Driver**:
   - Send an in-app notification to the driver informing them of the assignment.
   - Update the driver's availability status if necessary.

#### Workflow Diagram:
```mermaid
quadrantChart
  title Syntax Error Test
  x-axis Low Risk --> High
  y-axis Low Value --> High Value
  quadrant-1[Label]_BAD
  Critical: [1, 2]
```

**Figure 3.8.d**: Driver assignment algorithm showing selection criteria.

---

### 5. Refund Calculation Algorithm
The **Refund Calculation Algorithm** determines the refund amount for cancelled bookings based on the cancellation policy. The algorithm ensures fair and consistent refunds.

#### Algorithm Steps:
1. **Check Cancellation Window**:
   - Determine the time remaining until the pickup date.
   - If the cancellation is within 24 hours of pickup, apply a cancellation fee (e.g., 10% of total price).

2. **Calculate Refund Amount**:
   - Subtract the cancellation fee (if applicable) from the total price.
   - If the booking includes a driver, subtract the driver's fee from the refund amount.

3. **Process Refund**:
   - Initiate a refund with the payment gateway (e.g., Paymob) for the calculated amount.
   - Update the `Payment` record with `Status = Refunded`.
   - Update the `Booking` record with `Status = Cancelled`.
   - Send a cancellation confirmation email via AWS SES.

#### Workflow Diagram:
```mermaid
quadrantChart
  title Syntax Error Test
  x-axis Low Risk --> High
  y-axis Low Value --> High Value
  quadrant-1[Label]_BAD
  Critical: [1, 2]
```

**Figure 3.8.e**: Refund calculation algorithm showing policy-based logic.

---

## 3.9 User Interface Design

The **User Interface (UI)** of the Ares Car Rental system is designed with a focus on **usability**, **accessibility**, and **responsiveness**. The frontend is built using **Next.js** and **Material-UI (MUI)**, following modern UI/UX principles to ensure a seamless user experience across devices.

### Frontend Architecture
The frontend architecture is organized into the following key components:

1. **Pages**:
   - Define the routes of the application (e.g., `/`, `/vehicles`, `/bookings`).
   - Each page is a React component that fetches data and renders the appropriate layout.

2. **Components**:
   - Reusable UI components (e.g., `VehicleCard`, `BookingForm`, `NotificationCenter`).
   - Components are organized into a hierarchical structure, with higher-level components composing lower-level ones.

3. **Layouts**:
   - Define the overall structure of the application (e.g., `MainLayout`, `DashboardLayout`).
   - Include common elements such as headers, footers, and sidebars.

4. **Providers**:
   - Manage global state and services (e.g., `AuthProvider`, `ThemeProvider`).
   - Use React Context to provide state to components without prop drilling.

5. **Hooks**:
   - Custom hooks encapsulate reusable logic (e.g., `useAuth`, `useNotifications`).
   - Improve code organization and reusability.

6. **API Clients**:
   - Encapsulate API calls (e.g., `VehicleApi`, `BookingApi`).
   - Use **Axios** for HTTP requests, with interceptors for authentication and error handling.

7. **Styles**:
   - Use **Material-UI's theming system** for consistent styling across the application.
   - Custom styles are defined using **CSS-in-JS** (via `makeStyles` or `styled` API).

### Component Hierarchy
Below is a high-level overview of the component hierarchy for key pages:

```mermaid
graph TD
    %% Layouts
    MainLayout[MainLayout\nHeader, Footer, Content]
    DashboardLayout[DashboardLayout\nSidebar, Header, Content]

    %% Pages
    HomePage[HomePage\nHero, Featured Categories, Popular Destinations]
    VehicleSearchPage[VehicleSearchPage\nSearch Filters, Vehicle List]
    VehicleDetailsPage[VehicleDetailsPage\nVehicle Info, Images, Reviews, Booking Form]
    BookingCheckoutPage[BookingCheckoutPage\nCheckout Steps: Vehicle, Driver, Payment]
    UserProfilePage[UserProfilePage\nProfile Form, Verification Status]
    DashboardPage[DashboardPage\nStats, Recent Bookings, Upcoming Bookings]

    %% Components
    VehicleCard[VehicleCard\nImage, Make/Model, Rating, Price]
    BookingForm[BookingForm\nPickup/Return Dates, Locations, Driver Selection]
    NotificationCenter[NotificationCenter\nList, Mark as Read]
    SearchFilters[SearchFilters\nCategory, Price, Transmission]

    %% Relationships
    MainLayout --> HomePage
    MainLayout --> VehicleSearchPage
    MainLayout --> VehicleDetailsPage
    MainLayout --> BookingCheckoutPage
    MainLayout --> UserProfilePage
    DashboardLayout --> DashboardPage
    VehicleSearchPage --> SearchFilters
    VehicleSearchPage --> VehicleCard
    VehicleDetailsPage --> VehicleCard
    VehicleDetailsPage --> BookingForm
    VehicleDetailsPage --> ReviewList
    BookingCheckoutPage --> BookingForm
    UserProfilePage --> VerificationStatus
    DashboardPage --> BookingList
```

**Figure 3.9.a**: Component hierarchy showing key pages and components.

### State Management
The frontend uses a combination of **React Context** and **local component state** for state management:

1. **Global State**:
   - **Auth Context**: Manages authentication state (e.g., user, token).
   - **Theme Context**: Manages theme state (e.g., light/dark mode).
   - **Notification Context**: Manages unread notification count and polling.

2. **Local State**:
   - Managed within individual components using React's `useState` and `useReducer` hooks.
   - Examples: form inputs, search filters, modal visibility.

3. **API State**:
   - Managed using **React Query** for data fetching, caching, and synchronization.
   - Provides loading, error, and success states for API calls.

### Key UI/UX Decisions
1. **Responsive Design**:
   - The UI is designed to be **mobile-first**, ensuring a seamless experience on all devices.
   - Uses **Material-UI's Grid system** for responsive layouts.
   - Breakpoints are defined for different screen sizes (e.g., `xs`, `sm`, `md`, `lg`, `xl`).

2. **Accessibility**:
   - Follows **WCAG 2.1** guidelines for accessibility.
   - Uses semantic HTML elements (e.g., `<button>`, `<nav>`).
   - Provides keyboard navigation and screen reader support.
   - Ensures sufficient color contrast for readability.

3. **Theming**:
   - Supports **light and dark themes**, with user preference stored in `localStorage`.
   - Uses **Material-UI's theming system** for consistent colors, typography, and spacing.
   - Custom theme variables are defined in `theme.ts` (e.g., `primary`, `secondary`, `error` colors).

4. **Form Handling**:
   - Uses **React Hook Form** for form validation and submission.
   - Provides real-time validation feedback to users.
   - Supports multi-step forms (e.g., booking checkout).

5. **Notifications**:
   - In-app notifications are displayed in a **notification center** accessible from the header.
   - Unread notifications are indicated by a badge.
   - Notifications can be marked as read individually or in bulk.

6. **Error Handling**:
   - Errors from API calls are displayed in **snackbar notifications**.
   - Form validation errors are displayed inline.
   - Global errors (e.g., network issues) are displayed in a modal dialog.

7. **Loading States**:
   - Loading indicators (e.g., spinners, skeletons) are displayed during data fetching.
   - Skeleton screens are used for complex layouts to improve perceived performance.

### Example: Booking Checkout UI
The **Booking Checkout Page** is a multi-step form that guides the user through the booking process. The UI is designed to be intuitive and user-friendly, with the following key features:

1. **Stepper**:
   - Displays the current step in the checkout process (e.g., Vehicle, Driver, Payment).
   - Allows users to navigate between steps.

2. **Vehicle Summary**:
   - Displays the selected vehicle's details (e.g., make, model, image, price).
   - Includes a link to change the vehicle.

3. **Driver Selection**:
   - Displays a list of available drivers with their ratings, fees, and proximity.
   - Allows the user to select a driver or opt for self-drive (if eligible).

4. **Payment**:
   - Displays the total price breakdown (e.g., base price, insurance, driver fee).
   - Integrates with the payment gateway (e.g., Paymob) for secure payment processing.

5. **Confirmation**:
   - Displays a summary of the booking details.
   - Provides a confirmation button to finalize the booking.

#### UI Flow Diagram:
```mermaid
quadrantChart
  title Syntax Error Test
  x-axis Low Risk --> High
  y-axis Low Value --> High Value
  quadrant-1[Label]_BAD
  Critical: [1, 2]
```

**Figure 3.9.b**: Booking checkout UI flow showing multi-step form.

### Example: Dashboard UI
The **Dashboard Page** provides users with an overview of their activities and key metrics. The UI is tailored to the user's role (e.g., Customer, Supplier, Driver, Admin):

1. **Customer Dashboard**:
   - **Upcoming Bookings**: List of bookings scheduled for the next 7 days.
   - **Recent Bookings**: List of completed or cancelled bookings.
   - **Favorites**: List of vehicles marked as favorites.

2. **Supplier Dashboard**:
   - **Stats**: Total vehicles, pending approvals, active bookings, total earnings.
   - **Bookings by Status**: Counts of bookings in different states (e.g., pending, confirmed, active).
   - **Recent Bookings**: List of recent bookings for the supplier's vehicles.

3. **Driver Dashboard**:
   - **Stats**: Total earnings, available balance, completed bookings.
   - **Upcoming Assignments**: List of bookings assigned to the driver.
   - **Earnings Chart**: Monthly earnings breakdown.

4. **Admin Dashboard**:
   - **System Stats**: Total users, vehicles, bookings, revenue.
   - **Pending Verifications**: List of users awaiting identity verification.
   - **Recent Activity**: Timeline of recent system events.
   - **Revenue Overview**: Monthly revenue trends.

#### Dashboard Layout Diagram:
```mermaid
graph TD
    %% Admin Dashboard
    AdminDashboard[Admin Dashboard]
    AdminStats[Stats\nUsers, Vehicles, Bookings, Revenue]
    PendingVerifications[Pending Verifications\nList of Users]
    RecentActivity[Recent Activity\nTimeline of Events]
    RevenueOverview[Revenue Overview\nMonthly Trends]

    AdminDashboard --> AdminStats
    AdminDashboard --> PendingVerifications
    AdminDashboard --> RecentActivity
    AdminDashboard --> RevenueOverview
```

**Figure 3.9.c**: Admin dashboard layout showing key sections.
