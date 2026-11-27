# Installation Guide

How to install the **Open Frame** theme and the **Open Frame Starter Sites** plugin, check the downloaded files, update them, and remove them again.

You need a WordPress site and an administrator account. Nothing has to be installed on your own computer.

## What you download

Each release has its own page at <https://github.com/Mostafijemon24/Open-Frame-Theme/releases>, with these files under "Assets":

| File | What it is | Needed |
| --- | --- | --- |
| `open-frame-<version>.zip` | The theme | Always |
| `open-frame-starter-sites-<version>.zip` | The plugin with the ten starter sites | Only if you want to start from a ready-made design |
| the same names ending in `.sha256` | Checksums, to check that a download is complete and unchanged | Optional |

Do **not** use the green "Code → Download ZIP" button of the repository. That archive holds the development files of both products in one folder, and WordPress cannot install it.

Do not unzip the files. WordPress installs them as ZIP files.

## What your site needs

| | Theme | Starter Sites plugin |
| --- | --- | --- |
| WordPress | 6.4 or newer | 6.4 or newer; the designs need 6.8 or newer |
| PHP | 7.4 or newer | 7.4 or newer |
| Other plugins | None | Elementor 4.0.3 or newer for every design (installed from the plugin's own screen). Elementor Pro 4.0 or newer for five designs. WooCommerce 10.0 or newer for the Shop design |
| Server | Nothing special | Outgoing HTTPS requests, ZIP support, a writable uploads folder |

You find your versions of WordPress and PHP under **Tools → Site Health → Info**.

## 1. Install the theme

1. Go to **Appearance → Themes** and click **Add Theme**.
2. Click **Upload Theme**, then **Choose File**, and select `open-frame-<version>.zip`.
3. Click **Install Now**.
4. Click **Activate**.

The theme works at once, with a plain header showing your site title, your posts, and a copyright bar. The [theme guide](README.md) explains every setting.

## 2. Install the plugin (optional)

1. Go to **Plugins → Add Plugin** and click **Upload Plugin**.
2. Click **Choose File** and select `open-frame-starter-sites-<version>.zip`.
3. Click **Install Now**, then **Activate Plugin**.
4. Go to **Appearance → Starter Sites**.

There is no account to create and no key to enter. The [Starter Sites guide](STARTER-SITES.md) continues from here.

The theme has to be active first: the designs are made for Open Frame and cannot be imported into another theme.

## 3. Check that it worked

- **Appearance → Themes** shows Open Frame as "Active".
- **Appearance → Starter Sites** shows ten designs with their pictures. If the list is empty, see [Troubleshooting in the Starter Sites guide](STARTER-SITES.md#15-troubleshooting).
- **Tools → Site Health** reports no new critical issue.

## Checking a download (optional)

A checksum is a fingerprint of a file. If the fingerprint of your download matches the one published with the release, the file is complete and has not been changed on the way.

Put the ZIP file and its `.sha256` file in the same folder, open a terminal in that folder, and run:

**macOS**

```bash
shasum -a 256 -c open-frame-1.1.0.zip.sha256
```

**Linux**

```bash
sha256sum -c open-frame-1.1.0.zip.sha256
```

**Windows (PowerShell)**

```powershell
Get-FileHash open-frame-1.1.0.zip -Algorithm SHA256
```

On macOS and Linux the answer is `open-frame-1.1.0.zip: OK`. On Windows, compare the long line of letters and digits with the one inside the `.sha256` file; they have to be the same.

Use the file names of the version you downloaded.

## Installing by SFTP instead

If your host does not allow uploads from the dashboard:

1. Unzip the file on your computer.
2. Upload the folder `open-frame` to `wp-content/themes/`, and the folder `open-frame-starter-sites` to `wp-content/plugins/`.
3. Activate the theme under **Appearance → Themes** and the plugin under **Plugins**.

## Updating

Your settings and content are kept when you update. They are stored in the database, not in the files of the theme or the plugin.

1. Download the new ZIP file from the releases page.
2. Install it exactly as above (**Upload Theme** or **Upload Plugin**).
3. WordPress notices that the theme or plugin is already installed, shows both version numbers, and asks. Click **Replace current with uploaded**.

Before an update on a site with visitors, make a backup, and read the changes of the new version in the release notes.

If you changed files of the theme by hand, an update overwrites them. Put your own code into a child theme instead (see [Child themes in the theme guide](README.md#23-child-themes-and-developer-reference)).

How new versions are announced, and what is supported for how long, is in the [support and update policy](SUPPORT.md).

## Removing

**The plugin:** **Plugins → Deactivate**, then **Delete**. Deleting removes the plugin's own data (the saved list of designs, the import history, the fonts of imported designs). Pages, posts, products and pictures stay. Read [Removing the plugin](STARTER-SITES.md#16-removing-the-plugin) first if your site uses one of the designs for free Elementor: their header, footer and fonts are shown by the plugin.

**The theme:** activate another theme under **Appearance → Themes**, then open Open Frame's details and click **Delete**. Your content stays. The settings you made in the Customizer stay in the database and are used again if you install the theme later.

## If something goes wrong

| What you see | What to do |
| --- | --- |
| "The package could not be installed. The theme is missing the style.css stylesheet." | You uploaded the wrong file: the plugin ZIP under Themes, or the repository's "Download ZIP". Use `open-frame-<version>.zip` from the releases page |
| "The package could not be installed. No valid plugins were found." | The same mistake the other way round. Upload `open-frame-starter-sites-<version>.zip` under **Plugins** |
| "The uploaded file exceeds the upload_max_filesize directive" | Your host limits uploads to less than the size of the file. Ask the host to raise the limit, or install by SFTP |
| "The link you followed has expired" | The same limit, reported differently |
| "Destination folder already exists" | An older copy is there. Choose **Replace current with uploaded**, or delete the old copy first |
| A white page after activating | Switch back: rename the folder `wp-content/themes/open-frame` by SFTP and WordPress falls back to another theme. Then check that your site has PHP 7.4 or newer, and [report it](SUPPORT.md) |
