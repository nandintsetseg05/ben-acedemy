using BenAcademy.Shared;

namespace BenAcademy.Server.Services;

public interface IBenAiGradingService
{
    Task<BenAiResponse> GradeWritingAsync(BenAiRequest request, Guid authenticatedUserId, CancellationToken cancellationToken = default);
}
