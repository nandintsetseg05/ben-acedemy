using Xunit;

namespace BenAcademy.Tests;

[CollectionDefinition("BenAcademy integration")]
public class BenAcademyIntegrationCollection : ICollectionFixture<BenAcademyWebApplicationFactory>
{
}
