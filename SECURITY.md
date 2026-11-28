# Security Policy

## Supported versions

Security fixes are made for the newest released version of each product.

| Product | Supported |
| --- | --- |
| Open Frame (theme) | The newest release |
| Open Frame Starter Sites (plugin) | The newest release |
| The starter site library | The published library |

## Reporting a vulnerability

Please report it privately. Do not open a public issue with the details.

1. On this repository's page choose **Security → Report a vulnerability**. The report reaches the maintainer only.
2. If that form is not available to you, open an issue that says only "security report, please contact me", without details, and you will be contacted.

Say what is affected (theme, plugin or library, and its version), how the problem can be reproduced, and what an attacker could do with it.

You get an answer as soon as the report has been read. A confirmed problem is fixed in a patch release, and the release notes credit you unless you prefer otherwise. Please allow a reasonable time for the fix before publishing details.

## What is in scope

- The theme and the plugin as released on this repository's releases page.
- The plugin's import of starter sites: the signed list of designs, the verification of downloads, and the check that refuses script in a design.
- The library service at `api.buildbetters.com` and `cdn.buildbetters.com`.

Problems in WordPress itself, in Elementor, in WooCommerce or in another plugin are reported to their own maintainers.

More about support and updates: [docs/SUPPORT.md](docs/SUPPORT.md).
