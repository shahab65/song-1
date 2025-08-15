import {

    Card,
    ResourceList,
    ResourceItem,
    Text,
    Thumbnail,
} from "@shopify/polaris";

export default function ProductsList({ products }) {
    return (

        <Card>
            <ResourceList
                resourceName={{ singular: "product", plural: "products" }}
                items={products}
                renderItem={(product) => {
                    const media = product.featuredImage?.url ? (
                        <Thumbnail
                            source={product.featuredImage.url}
                            alt={product.title}
                        />
                    ) : (
                        <Thumbnail
                            source=""
                            alt={product.title}
                        />
                    );

                    return (
                        <ResourceItem
                            id={product.id}
                            media={media}
                            accessibilityLabel={`View details for ${product.title}`}
                            url={product.onlineStoreUrl || "#"}
                        >
                            <Text variant="bodyMd" fontWeight="bold" as="h3">
                                {product.title}
                            </Text>
                            <div>{product.status}</div>
                        </ResourceItem>
                    );
                }}
            />
        </Card>

    );
}
