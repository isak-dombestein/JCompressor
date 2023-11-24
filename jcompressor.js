let jszip = require('jszip');
var zip = new jszip();
const fs = require('fs').promises;
const path = require('path');
let inputPath = process.argv[3];
let output = process.argv[5] || 'output.zip';
let outputPath = process.argv[5] || './output';

async function main() {
    // Check if user has provided any arguments
if (process.argv.length === 2) {
    console.error('No arguments provided. Use -h for reference.');
    process.exit(1);
}


// Help documentation. 
if(process.argv[2] === '-h' || process.argv[2] === '--help') {
    console.log('JCompressor - A simple file compression utility written in Node.js');
    console.log('Build: 0.1a - 2023-11-24')
    console.log('Usage: node jcompressor.js [arguments]');
    console.log();
    console.log('Arguments:');
    console.log('-z, --zip: Compresses the file into a zip file');
    console.log('-u, --unzip: Unzips the file');
    console.log('-o, --output: Output file name');
    console.log('-h, --help: Displays this help message');
    console.log();
    console.log('Note: Output is set to output.zip by default for -z/--zip, and ./output for -u/--unzip.')
    process.exit(0);
}

if (process.argv[2] === '-z' || process.argv[2] === '--zip') {
    if (!process.argv[3]) {
        console.log('No file was provided. A file or folder is required for -z or --zip.')
        process.exit(1);
    } else {
        await compressToZip(zip, inputPath);
        zip.generateAsync({ type: 'nodebuffer' }).then((content) => {
            fs.writeFile(`${output}`, content);
        });
    }
}

if (process.argv[2] === '-u' || process.argv[2] === '--unzip') {
    if (!process.argv[3]) {
        console.log('No file was provided. Please provide a file to unzip.');
    } else {
        unzip(process.argv[3], outputPath);
    }
}
}

async function checkIfFolder(path) {
    try {
        const stats = await fs.stat(path);
        if (stats.isFile()) {
            return 'File';
        } else if (stats.isDirectory()) {
            return 'Directory';
        } else {
            console.error(`Error: ${path} is not a file or directory.`);
            return 'Error';
        }

        // return stats.isFile() ? 'File' : stats.isDirectory() ? 'Directory': 'Neither';
    } catch (err) {
        // In case 404 File not found
        console.error(`Error: ${path} - ${err.message}`)
    }
}

async function compressToZip(zip, inputPath) {
    const type = await checkIfFolder(inputPath);

    if (type === 'File') {
        try {
            const content = await fs.readFile(inputPath);
            zip.file(path.basename(inputPath), content);
        } catch (error) {
            console.error(`Error while reading file ${inputPath}: ${error}`);
        }
    } else if (type === 'Directory') {
        try {
            const files = await fs.readdir(inputPath);
            const filePromises = files.map(file =>
                compressToZip(zip.folder(path.basename(inputPath)), path.join(inputPath, file))
            );
            await Promise.all(filePromises);
            console.log(`Compressed ${inputPath} to ${output}`);
        } catch (error) {
            console.error(`Error while reading directory ${inputPath}: ${error}`);
        }
    } else {
        console.error(`Error: ${inputPath} is not a supported file type. If you believe this is an error, please submit an issue on the github repo (https://github.com/isak-dombestein/JCompressor)`);
    }
}


async function unzip(zipPath, outputPath) {
    try {
        const zipData = await fs.readFile(zipPath);
        const zipFile = await zip.loadAsync(zipData);

        await Promise.all(
            Object.keys(zipFile.files).map(async (filename) => {
                const content = await zipFile.files[filename].async('nodebuffer');
                const outputFilePath = path.join(outputPath, filename);  // Adjusted path construction
                const outputDirectory = path.dirname(outputFilePath);

                // Create the directory if it doesn't exist
                await fs.mkdir(outputDirectory, { recursive: true });

                await fs.writeFile(outputFilePath, content);
            })
        );
        console.log(`Unzipped ${zipPath} to ${outputPath}`);
    } catch (error) {
        console.error(`Error while unzipping ${zipPath}: ${error}`);
    }
}



main();