const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const jszip = require('jszip');
const archiver = require('archiver');

let zip = new jszip();


let inputPath = process.argv[3];
let output = process.argv[5] || 'output.zip';
let outputPath = process.argv[5] || './output';

function checkArguments() {
    const args = []
    for (let i = 2; i < process.argv.length; i++) {
        const arg = process.argv[i];

        if(arg.startsWith('-')) {
            // Argument is a flag
            const nextArg = process.argv[i + 1];
            if (nextArg && !nextArg.startsWith('-')) {
                args[arg] = nextArg;
                i++;
            } else {
                args[arg] = true; // Flag without value
            }
        }
    }
    return args;
}

const parsedArgs = checkArguments();

// Input Arguments
const zipArg = parsedArgs['-z'] || parsedArgs['--zip'];
const unzipArg = parsedArgs['-u'] || parsedArgs['--unzip'];
const outputArg = parsedArgs['-o'] || parsedArgs['--output'];
const strengthArg = parsedArgs['-s'] || parsedArgs['--strength'];
const helpArg = parsedArgs['-h'] || parsedArgs['--help'];


async function main() {
    // Check if user has provided any arguments
    if (process.argv.length === 2) {
        console.error('No arguments provided. Use -h or --help for reference.');
        process.exit(1);
    }


    // Help documentation. 
    if(helpArg) {
        console.log('JCompressor - A simple file compression utility written in Node.js');
        console.log('Build: 0.3a - 2023-11-30')
        console.log('Usage: node jcompressor.js [arguments]');
        console.log();
        console.log('Arguments:');
        console.log('-z, --zip: Compresses a file or folder into a zip file');
        console.log('-u, --unzip: Unzips a given zip file');
        console.log('-o, --output: Output file name');
        console.log('-s, --strength: Compression level (Range 0-9)')
        console.log('-h, --help: Displays this help message');
        console.log();
        console.log('Note: Output is set to output.zip by default for -z/--zip, and ./output for -u/--unzip.')
        console.log('Compression levels range from 0 to 9 where 0 is no compression and 9 is max compression. Depending on the selected compression level, the process may take longer to complete.')
        process.exit(0);
    }

    if (zipArg === undefined || zipArg === true) {
        console.error('No file was provided. A file or folder is required for -z or --zip.');
        process.exit(1);
    }

    if (zipArg) {
         await compressToZip(zip, zipArg);
         zip.generateAsync({ type: 'nodebuffer' }).then((content) => {
            const output = outputArg || 'output.zip'; //Use the requested output name or default to output.zip.
            fsp.writeFile(output, content);
         });
    }

    if (unzipArg) {
        if (!unzipArg || unzipArg === true) {
            console.error('No file provided, please provide a file to unzip!');
            process.exit(1);
        } else {
            unzip(unzipArg, outputPath);
        }
    }

    if(strengthArg !== undefined) {
        if (isNaN(strengthArg) || strengthArg < 0 || strengthArg > 9) {
            console.error('Invalid number provided for compression level. Please provide a number between 0 and 9, or run again without -s or --strength for default compression level.');
            process.exit(1);
        } else {
            const output = outputArg || 'output.zip';
            archiveStream(zipArg, parseInt(strengthArg), output);
        }
    }
}

async function checkIfFolder(path) {
    try {
        const stats = await fsp.stat(path);
        if (stats.isFile()) {
            return 'File';
        } else if (stats.isDirectory()) {
            return 'Directory';
        } else {
            console.error(`Error: ${path} is not a file or directory.`);
            return 'Error';
        }

    } catch (err) {

        console.error(`Error: ${path} - ${err.message}`)
    }
}

async function compressToZip(zip, inputPath) {

    const type = await checkIfFolder(inputPath);

    if (type === 'File') {
        try {
            const content = await fsp.readFile(inputPath);
            zip.file(path.basename(inputPath), content);
        } catch (error) {
            console.error(`Error while reading file ${inputPath}: ${error}`);
        }
    } else if (type === 'Directory') {
        try {
            const files = await fsp.readdir(inputPath);
            const filePromises = files.map(file =>
                compressToZip(zip.folder(path.basename(inputPath)), path.join(inputPath, file))
            );
            await Promise.all(filePromises);
            console.log(`Compressed ${inputPath} to ${outputArg}`);
        } catch (error) {
            console.error(`Error while reading directory ${inputPath}: ${error}`);
        }
    } else {
        console.error(`Error: ${inputPath} is not a supported file type. If you believe this is an error, please submit an issue on the github repo (https://github.com/isak-dombestein/JCompressor)`);
    }
}


async function unzip(zipPath, outputPath) {
    try {
        const zipData = await fsp.readFile(zipPath);
        const zipFile = await zip.loadAsync(zipData);

        await Promise.all(
            Object.keys(zipFile.files).map(async (filename) => {
                const content = await zipFile.files[filename].async('nodebuffer');
                const outputFilePath = path.join(outputPath, filename);

                if (zipFile.files[filename].dir) {
                    await fsp.mkdir(outputFilePath, { recursive: true });
                } else {
                    const outputDirectory = path.dirname(outputFilePath);
                    await fsp.mkdir(outputDirectory, { recursive: true });
                    await fsp.writeFile(outputFilePath, content);
                }
            })
        );
        console.log(`Unzipped ${zipPath} to ${outputPath}`);
    } catch (error) {
        console.error(`Error while unzipping ${zipPath}: ${error}`);
    }
}

async function archiveStream(inputPath, strength, outputPath) {
    const output = fs.createWriteStream(outputPath);

    const archive = archiver('zip', {
        zlib: { level: strength }
    });

    output.on('close', function() {
        console.log(archive.pointer() + ' total bytes');
        console.log('Output Finalized, File descriptor closed');
    });

    output.on('end', function() {
        console.log('Data has been drained');
    });

    archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
            console.log('ERROR ENOENT: ' + err.message);
        } else {
            throw err;
        }
    });

    archive.on('error', function(err) {
        throw err;
    });

    archive.pipe(output);

    const type = await checkIfFolder(inputPath);
    if (type === 'File') {
        try {
            const file = inputPath;
            archive.append(fs.createReadStream(file), { name: path.basename(file) });
        } catch (error) {
            console.error(`Error while reading file ${inputPath}: ${error}`);
        }
    } else if (type === 'Directory') {
        try {
            archive.directory(inputPath, path.basename(inputPath));
        } catch(error) {
            console.error(`Error while reading directory ${inputPath}: ${error}`);
        }
    } else {
        console.error(`Error: ${inputPath} is not a supported file type. If you believe this is an error, please sutmit an issue on the Github repo (https://github.com/isak-dombestein/JCompressor)`);
    }

    await archive.finalize();
}





main();