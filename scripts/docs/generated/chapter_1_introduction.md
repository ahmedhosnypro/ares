# CHAPTER 1: INTRODUCTION

## 1.1 Background and Motivation  

The rapid growth of urban mobility services has intensified the demand for efficient, reliable, and user‑friendly car‑rental platforms. Traditional rental systems often suffer from fragmented architectures, limited integration with modern payment gateways, and inadequate support for dynamic pricing and real‑time notifications. Consequently, both end‑users and fleet administrators encounter usability bottlenecks, security vulnerabilities, and operational inefficiencies.  

The **Ares Car Rental** project addresses these shortcomings by delivering a full‑stack solution that combines a **.NET 10** backend (ASP.NET Core, Entity Framework Core) with a **Next.js 16** frontend (React 19, TypeScript, Tailwind CSS). The architecture embraces clean‑layered separation—Api, Application, Domain, and Infrastructure—facilitating maintainability and scalability. Key technological choices such as **JWT‑based authentication**, **Swagger/OpenAPI documentation**, **Serilog** for structured logging, and **Paymob** integration for secure online payments reflect current industry best practices.  

The primary aim of this graduation project is to design, implement, and evaluate a modern car‑rental platform that satisfies the functional expectations of customers and administrators while adhering to stringent non‑functional quality attributes (security, performance, and usability). The solution is structured as follows:

1. **Backend API** – Exposes RESTful endpoints for public operations (vehicle search, booking) and protected admin functionalities (fleet and supplier management).  
2. **Application Layer** – Encapsulates business rules, validation (FluentValidation), and mediates commands/queries via **MediatR**.  
3. **Domain Layer** – Defines core entities and domain logic, ensuring a clear separation from infrastructure concerns.  
4. **Infrastructure Layer** – Provides data persistence (SQL Server via EF Core), identity management, and repository implementations.  
5. **Frontend** – Implements a responsive user interface with role‑based navigation, real‑time notifications, and integration with the backend through typed API clients.  

The remainder of this chapter outlines the problem addressed, the concrete objectives, the methodological approach adopted, and the organization of the full report.

---

## 1.2 Problem Statement  

Car‑rental enterprises require an integrated digital platform that can:

* **Present up‑to‑date vehicle availability** across multiple locations in real time.  
* **Support secure online payments** while handling asynchronous webhook callbacks from external gateways.  
* **Enable administrators** to manage fleets, suppliers, and pricing models with role‑based access control.  
* **Provide reliable notifications** to both customers and staff regarding booking status changes.  

Existing solutions often lack a cohesive full‑stack implementation, resulting in fragmented user experiences, manual data reconciliation, and heightened exposure to security threats (e.g., insecure authentication, inadequate input validation). The absence of a unified, test‑driven codebase hampers extensibility and increases maintenance costs.  

The significance of this problem is evident for the following stakeholders:

* **End‑users** – Seek a seamless reservation process, transparent pricing, and trustworthy payment handling.  
* **Fleet administrators** – Require efficient CRUD operations, audit trails, and role‑based safeguards.  
* **Business owners** – Need a scalable platform that can adapt to fluctuating demand and integrate with third‑party services (e.g., payment gateways, mapping APIs).  

Addressing these gaps will contribute to higher customer satisfaction, reduced operational overhead, and a demonstrable alignment with contemporary software engineering standards.

---

## 1.3 Project Objectives  

### Functional Objectives  

1. **Vehicle Search & Discovery** – Implement filters (date, location, vehicle type) and display detailed vehicle information.  
2. **Reservation Workflow** – Enable users to create, modify, and cancel bookings with real‑time availability checks.  
3. **Payment Integration** – Incorporate Paymob’s API for card payments, handling both redirect (user‑facing) and webhook (server‑to‑server) callbacks.  
4. **Admin Fleet Management** – Provide full CRUD capabilities for vehicles, including soft‑deletion and validation of active bookings.  
5. **Admin Supplier Management** – Offer paginated supplier listings, detailed view, creation, update, and deactivation functionalities.  
6. **Dynamic Pricing Engine** – Calculate rental costs based on duration, insurance options, and ancillary services.  
7. **Notification System** – Broadcast platform‑wide alerts to administrators and send booking status updates to customers.  
8. **API Documentation** – Generate interactive Swagger UI for all public and protected endpoints.  

### Non‑Functional Objectives  

1. **Security** – Enforce JWT authentication, role‑based authorization, HTTPS communication, and input validation to mitigate OWASP Top‑10 risks.  
2. **Performance** – Achieve sub‑200 ms response times for read‑heavy operations under typical load (≥100 concurrent users).  
3. **Scalability** – Design the backend to support horizontal scaling via stateless services and connection‑pooling.  
4. **Usability** – Deliver an intuitive, responsive UI adhering to WCAG 2.1 AA accessibility guidelines.  
5. **Maintainability** – Apply clean architecture principles, unit‑test coverage ≥80 % (xUnit, FsCheck), and continuous integration pipelines.  
6. **Reliability** – Ensure 99.5 % uptime through health‑check endpoints and graceful degradation strategies.  

---

## 1.4 Methodology  

### Requirement Analysis  

* Conducted stakeholder interviews (customers, fleet managers, developers) to elicit functional and non‑functional requirements.  
* Produced a **Requirements Specification Document** detailing use cases, user stories, and acceptance criteria.  

### System Specification  

* **Architectural Style:** Layered clean architecture separating concerns into Api, Application, Domain, and Infrastructure.  
* **Technology Stack:**  
  * Backend – .NET 10, ASP.NET Core, EF Core (SQL Server), AutoMapper, FluentValidation, Serilog, Swashbuckle.  
  * Frontend – Next.js 16, React 19, TypeScript, Tailwind CSS, NextAuth.js, Radix UI.  
  * Testing – xUnit, Moq, FsCheck (property‑based testing), Microsoft.AspNetCore.Mvc.Testing, In‑Memory EF Core provider.  
* **Functional Requirements:** Captured in the *User Stories* section of the specification; each mapped to API endpoints and UI components.  
* **Non‑Functional Requirements:** Documented with measurable criteria (e.g., response time, security controls).  

### Development Process  

1. **Iterative Prototyping** – Adopted an agile sprint cycle (2‑week sprints) to deliver incremental features.  
2. **Version Control & CI/CD** – Utilized GitHub Actions for automated builds, linting, formatting, and test execution.  
3. **Security Measures:**  
   * JWT tokens signed with strong secret keys.  
   * HTTPS enforced via Kestrel and reverse‑proxy configuration.  
   * Input validation through FluentValidation and Zod (frontend).  
   * Role‑based policies defined in ASP.NET Core Identity.  
4. **Quality Assurance:**  
   * Static analysis (SonarQube, ESLint) and code style enforcement (Prettier, Biome).  
   * Unit and integration tests covering business logic, data access, and API contracts.  
   * End‑to‑end tests using Playwright for critical user flows.  

### Evaluation  

* Performance benchmarking using **k6** scripts to simulate concurrent users.  
* Security testing via OWASP ZAP scans and manual penetration testing of authentication flows.  
* Usability assessment through heuristic evaluation and limited user testing sessions.  

---

## 1.5 Report Organization  

The remainder of this report is structured as follows:

* **Chapter 2 – Literature Review:** Examines existing car‑rental systems, related work on payment gateway integration, and architectural patterns relevant to the project.  
* **Chapter 3 – System Design:** Presents high‑level architecture diagrams, data models, API specifications, and UI wireframes.  
* **Chapter 4 – Implementation:** Details the concrete realization of each layer, key code excerpts, and integration of third‑party services.  
* **Chapter 5 – Testing and Evaluation:** Describes the testing strategy, presents results of functional, performance, and security testing, and discusses compliance with the defined objectives.  
* **Chapter 6 – Discussion:** Interprets the findings, highlights limitations, and proposes avenues for future enhancement.  
* **Chapter 7 – Conclusion:** Summarizes the contributions of the project and reflects on its alignment with the initial goals.  
* **References:** Lists all scholarly and technical sources cited throughout the document.  
* **Appendices:** Includes supplementary material such as configuration files, full test reports, and user manuals.  

This structure ensures a logical progression from problem identification through solution design, implementation, and critical appraisal, thereby fulfilling the academic standards of Al‑Azhar University’s Faculty of Engineering.