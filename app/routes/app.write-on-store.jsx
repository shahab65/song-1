import {
  Box,
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";

/* ---------------- Loader: fetch shop id + name ---------------- */
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query {
      shop {
        id
        name
      }
    }
  `);

  const { data } = await response.json();

  return {
    shopId: data.shop.id,
    shopName: data.shop.name,
  };
};

/* ---------------- Action: write metafield on the shop ---------------- */
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const shopId = formData.get("shopId");

  const response = await admin.graphql(`
    mutation {
      metafieldsSet(metafields: [
        {
          ownerId: "${shopId}",
          namespace: "custom",
          key: "greeting",
          type: "single_line_text_field",
          value: "Hello from my "
        }
      ]) {
        userErrors {
          field
          message
        }
      }
    }
  `);

  const data = await response.json();
  console.log("metafieldsSet result:", JSON.stringify(data, null, 2));

  return null;
};

/* ---------------- Page component ---------------- */
export default function AdditionalPage() {
  const { shopId, shopName } = useLoaderData();
  const fetcher = useFetcher();

  return (
    <Page>
      <TitleBar title={`Additional page for ${shopName}`} />
      <Layout>
        <Layout.Section>
          <fetcher.Form method="post">
            <input type="hidden" name="shopId" value={shopId} />
            <Button submit loading={fetcher.state !== "idle"}>
              Write metafield on store
            </Button>
          </fetcher.Form>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                What this does:
              </Text>
              <Text as="p" variant="bodyMd">
                Clicking the button will write a metafield on your shop under{" "}
                <code>custom.greeting</code> with the value{" "}
                <code>Hello from my app 🚀</code>.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
