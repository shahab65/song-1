import {
  Page,
  Layout,
  Card,
  BlockStack,
  Button,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { Form, useActionData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

// ✅ The server action that handles the upload
import { json } from "@remix-run/node";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return json({ success: false, error: "No file uploaded" }, { status: 400 });
  }

  // Step 1: Ask Shopify for an upload URL
  const uploadUrlResp = await admin.graphql(`
    mutation generateUploadUrl {
      stagedUploadsCreate(input: [{
        resource: GENERIC_FILE,
        filename: "${file.name}",
        mimeType: "${file.type}",
        httpMethod: POST
      }]) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `);

  const uploadUrlData = await uploadUrlResp.json();
  console.log("stagedUploadsCreate response", JSON.stringify(uploadUrlData, null, 2));

  const stagedTarget =
    uploadUrlData.data.stagedUploadsCreate.stagedTargets[0];

  if (!stagedTarget) {
    return json({ success: false, error: "Failed to get staged upload target" }, { status: 500 });
  }

  // Step 2: Upload the file binary directly to S3
  const s3Data = new FormData();
  stagedTarget.parameters.forEach(({ name, value }) => {
    s3Data.append(name, value);
  });
  s3Data.append("file", file);

  const s3Resp = await fetch(stagedTarget.url, {
    method: "POST",
    body: s3Data,
  });

  if (!s3Resp.ok) {
    const text = await s3Resp.text();
    console.error("S3 upload failed", text);
    return json({ success: false, error: "Upload to S3 failed" }, { status: 500 });
  }

  // Step 3: Finalize the file in Shopify
  const createResp = await admin.graphql(`
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          __typename
          ... on GenericFile {
            id
            url
            createdAt
            fileStatus
            alt
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      files: [
        {
          originalSource: stagedTarget.resourceUrl,
          contentType: "GENERIC_FILE",
        },
      ],
    },
  });

  const createData = await createResp.json();
  console.log("fileCreate response", JSON.stringify(createData, null, 2));

  if (createData.errors) {
    return json({ success: false, error: createData.errors }, { status: 500 });
  }

  const fileEntry = createData.data.fileCreate.files[0];

  return json({
    success: true,
    file: fileEntry || null,
  });
};


// ✅ The UI
export default function UploadFilePage() {
  const actionData = useActionData();

  return (
    <Page>
      <TitleBar title="Upload Audio File" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Upload a file
              </Text>
              <Form method="post" encType="multipart/form-data">
                <input type="file" name="file" accept="audio/*" />
                <br />
                <Button submit>Upload</Button>
              </Form>

              {actionData?.error && (
                <Text tone="critical">{actionData.error}</Text>
              )}
              {actionData?.success && (
                <Text tone="success">
                  File uploaded! URL: {actionData.fileUrl}
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
