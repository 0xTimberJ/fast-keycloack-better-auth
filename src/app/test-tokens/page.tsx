import { runAllTests, testCookiesCreated, testJWTExpiration, testAutoRefresh } from "@/app/actions/test-tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function TestTokensPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">🧪 Test des Tokens OAuth</h1>

      <div className="grid gap-4">
        {/* Test Quick */}
        <Card>
          <CardHeader>
            <CardTitle>✅ Test Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Verify that the cookies are created and the tokens are valid. (check the logs in your terminal because it's not visible in the browser )
            </p>

            <form action={async () => {
              "use server";
              const result = await testCookiesCreated();
              console.log("Test Cookies Result:", result);
            }}>
              <Button type="submit">Test 1: Verify Cookies</Button>
            </form>

            <form action={async () => {
              "use server";
              const result = await testJWTExpiration();
              console.log("Test JWT Expiration:", result);
            }}>
              <Button type="submit" variant="secondary">
                Test 7: Vérifier l&apos;Expiration
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Test Auto-Refresh */}
        <Card>
          <CardHeader>
            <CardTitle>🔄 Test Auto-Refresh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Simule l&apos;expiration d&apos;un token et vérifie que le refresh automatique fonctionne.
            </p>
            <p className="text-xs text-yellow-600">
              ⚠️ Ce test supprime temporairement votre access_token pour simuler une expiration.
            </p>

            <form action={async () => {
              "use server";
              const result = await testAutoRefresh();
              console.log("Test Auto-Refresh:", result);
            }}>
              <Button type="submit" variant="outline">
                Test 6: Tester l&apos;Auto-Refresh
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Test Complet */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Suite de Tests Complète</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Lance tous les tests (7 au total) et affiche les résultats dans la console.
            </p>

            <form action={async () => {
              "use server";
              const result = await runAllTests();
              console.log("=== TOUS LES TESTS ===", result);
            }}>
              <Button type="submit" variant="default" className="w-full">
                🚀 Lancer Tous les Tests
              </Button>
            </form>

            <div className="mt-4 p-4 bg-secondary rounded-lg">
              <p className="text-sm font-semibold mb-2">Tests inclus:</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Test 1: Vérifier que les 3 cookies sont créés</li>
                <li>Test 2: Vérifier que les tokens sont chiffrés</li>
                <li>Test 3: Vérifier le déchiffrement</li>
                <li>Test 4: Tester getAccessToken()</li>
                <li>Test 5: Tester le refresh manuel</li>
                <li>Test 6: Tester l&apos;auto-refresh</li>
                <li>Test 7: Décoder le JWT et vérifier l&apos;expiration</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
