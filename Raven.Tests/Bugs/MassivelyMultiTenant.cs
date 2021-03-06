using Raven.Client.Document;
using Raven.Client.Extensions;
using Xunit;

namespace Raven.Tests.Bugs
{
	public class MassivelyMultiTenant : RemoteClientTest
	{
		[Fact]
		public void CanHaveLotsOf_ACTIVE_Tenants()
		{
			using (GetNewServer(requestedStorage: "esent"))
			{
				for (int i = 0; i < 20; i++)
				{
					var databaseName = "Tenants" + i;
					using (var documentStore = new DocumentStore {Url = "http://localhost:8079", DefaultDatabase = databaseName}.Initialize())
					{
						documentStore.DatabaseCommands.EnsureDatabaseExists(databaseName);
					}
				}
			}
		}
	}
}