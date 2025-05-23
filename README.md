# JCompressor
A JavaScript-based compression tool. Supports compressing both individual files as well as entire folders.

# Usage
Note: Requires Node.js to be installed. 

When running for the first time, make sure to run npm install first to make sure you have all dependencies installed as specified in package.json.

In a terminal window, run 
``` bash
node jcompressor.js [arguments] # You can run jcompressor without the .js extension too. Both work!
```

Supported arguments:
* -i, --image: Compresses an image file
* -f, --format: Output format for image compression. Supported formats are: jpeg, png, webp, gif, tiff, avif, heif and raw.
* -z, --zip: Compresses the file into a zip file
* -u, --unzip: Unzips the file
* -o, --output: Output file name
* -s, --strength: Compression level (Range 0-9)
* -h, --help: Displays the help message

Note: For compressing files, the default output is 'output.zip'. For extracting files, default directory is ./output.
Compression levels range from 0 to 9 where 0 is no compression and 9 is max compression. Depending on the selected compression level, the process may take longer to complete.

### Examples
Compressing a regular file to zip:
``` bash
node jcompressor.js -z important-document.pdf # creates output.zip with document in it
```
Compressing a folder:
``` bash
node jcompressor --zip node_modules --output node_modules_compressed.zip # creates node_modules_compressed.zip and adds the files in the folder (including subfolders.)
```
Extracting files from zip file:
``` bash
node jcompressor -u node_modules_compressed.zip -o ./nodemodules # Creates a new folder 'nodemodules' and extracts the files to that folder.
```

# Bugs and requests
All bug reports and requests should be submitted as an issue on the repository.
Issues will be addressed as soon as possible, but be aware that there might be delays from time to time in responding to issues.


# License
This project is licensed under GPLv3. Please read the LICENSE file for further information.