import type { ComponentPropsWithoutRef } from "react";

/**
 * User uploads can be local blob previews or runtime-configured S3 URLs.
 * Keeping one raw image boundary preserves both cases without a broad remote
 * image allowlist or a visual change in the editors and public renderer.
 */
export default function UserContentImage(
  { alt, ...props }: ComponentPropsWithoutRef<"img"> & { alt: string },
) {
  // eslint-disable-next-line @next/next/no-img-element -- See component documentation above.
  return <img alt={alt} {...props} />;
}
