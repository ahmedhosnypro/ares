using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Application.DTOs.Driver;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;

namespace Backend.Application.Services
{
    public class ServiceAreaService : IServiceAreaService
    {
        private readonly IServiceAreaRepository _repository;

        public ServiceAreaService(IServiceAreaRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<ServiceAreaDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            var areas = await _repository.GetAllAsync(cancellationToken);
            return areas.Select(a => new ServiceAreaDto
            {
                Id = a.Id,
                Name = a.Name,
                Governorate = a.Governorate,
                IsActive = a.IsActive
            }).ToList();
        }

        public async Task<ServiceAreaDto> CreateAsync(ServiceAreaDto request, CancellationToken cancellationToken = default)
        {
            var entity = new ServiceArea
            {
                Name = request.Name,
                Governorate = request.Governorate,
                IsActive = request.IsActive
            };

            await _repository.AddAsync(entity, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            request.Id = entity.Id;
            return request;
        }

        public async Task<ServiceAreaDto> UpdateAsync(Guid id, ServiceAreaDto request, CancellationToken cancellationToken = default)
        {
            var entity = await _repository.GetByIdAsync(id, cancellationToken);
            if (entity != null)
            {
                entity.Name = request.Name;
                entity.Governorate = request.Governorate;
                entity.IsActive = request.IsActive;

                await _repository.UpdateAsync(entity, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);
            }
            return request;
        }

        public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var entity = await _repository.GetByIdAsync(id, cancellationToken);
            if (entity != null)
            {
                entity.IsActive = false; // Soft delete
                await _repository.UpdateAsync(entity, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
