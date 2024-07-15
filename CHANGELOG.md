# CHANGELOG
Latest version is always on top. 

## v0.4a:
- Fixed a bug where strength argument was always required
- Reformatted code to be more flexible with how arguments are parsed

__NOTE:__
Image compression and strength argument WILL be removed in version 0.5a. This due to low requirement and no effect when using -s or --strength.
This means the following arguments will be removed in v0.5a:
- -s and --strength
- -i and --image
- -f and --format

These features might be added again at a later point of time, but more testing will be required before it's viable to add to a stable release for now.

## v0.3a:
- Improved support for Image compression with custom output options (Unstable)
- Added support for compression strength (Note: This feature isn't very reliable at the moment and can posibly be removed in later releases. Submit any bugs as an issue if any arise.)
- Fixed a bug where dest.on would be an invalid function (Github Issue #2)
- Removed object wrapping of output

## v0.2a:
- Fixed a bug where we would try to write a directory path to a file when extracting folders from a zip-file (Github Issue #1)
- Added initial support for image compression

## v0.1a:
- Initial Release