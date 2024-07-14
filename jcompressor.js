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
            args[arg] = nextArg;
            i++; // We skip the next argument since it's the value for the flag
        } else {
            args[arg] = true; // Flag without value
        }
    }
    return args;
}

const parsedArgs = checkArguments();

// Input Arguments
const zipArg = parsedArgs['-z'] || parsedArgs['--zip'];
const imageArg = parsedArgs['-i'] || parsedArgs['--image'];
const formatArg = parsedArgs['-f'] || parsedArgs['--format'];
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
    if(process.argv[2] === '-h' || process.argv[2] === '--help') {
        console.log('JCompressor - A simple file compression utility written in Node.js');
        console.log('Build: 0.3a - 2023-11-30')
        console.log('Usage: node jcompressor.js [arguments]');
        console.log();
        console.log('Arguments:');
        console.log('-i, --image: Compresses an image file');
        console.log('-f, --format: Output format for image compression. Supported formats are: jpeg, png, webp, gif, tiff, avif, heif and raw.');
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
         await compressToZip(zip, inputPath);
        zip.generateAsync({ type: 'nodebuffer' }).then((content) => {
            fsp.writeFile(`${output}`, content);
        });

    }

    if (strengthArg === undefined || strengthArg === true) {
        console.error('No compression level provided. Please provide a compression level between 0 and 9, or run again without -s or --strength for default compression.');
        process.exit(1);
    }

    if (strengthArg) {
        if (!outputArg || outputArg === undefined || outputArg === true) {
            let defOutput = 'output.zip';
            archiveStream(zipArg, strengthArg, defOutput)
        } else {
            archiveStream(zipArg, strengthArg, outputArg)
        }
    }

    if (checkArguments('-u') === true || checkArguments('--unzip') === true) {
        if (!process.argv[3]) {
            console.log('No file was provided. Please provide a file to unzip.');
        } else {
            unzip(process.argv[3], outputPath);
        }
    }

    if (checkArguments('-i') === true || checkArguments('--image') === true) {
        if (!process.argv[3]) {
            console.log('No image was provided. Please provide an image you wish to compress.');
        } else  if (checkArguments('-f') === true || checkArguments('--format') === true) {
            compressImage(process.argv[3]);
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

async function compressImage(imagePath) {
    const [image, format] = imagePath.split('.');
    let outputFormat = process.argv[5];
    console.log(`Compressing ${image}.${format} to jcmp_${image}.${outputFormat}...`);

}

async function archiveStream(inputPath, strength, outputPath) {

    const readFile = async (inputPath) => {
        try {
            return await fsp.readFile(inputPath);
        } catch(error) {
            throw error;
        }
    }

    // Create the output stream. path.join used to ensure platform compatibliity.
    const output = fs.createWriteStream(path.join(__dirname, `${outputPath}.zip`, 'w'));

    // The top part is mostly just copied from the Archiver quick start guide. 

    const archive = archiver('zip', {
        zlib: { level: strength }
    });

    output.onclose = function() {
        console.log(archive.pointer() + ' total bytes');
        console.log('Output finalized - file descriptor closed.');
    };

    output.onend = function() {
        console.log('Drained data...');
    };

    archive.on('warning', function(err) {
        if (err.code == 'ENOENT') {
            console.log('ERROR ENOENT: ' + err.message);
        } else {
            throw err;
        }
    });

    archive.on('error', function(err) {
        throw err;
    });

    archive.pipe(output);

    // Need to check if input is file or folder
    const type = await checkIfFolder(inputPath);

    if (type === 'File') {
        try {
            // Append file to writestream
            const file = inputPath;
            archive.append(fs.createReadStream(file), {name: path.basename(file)});
        } catch (error) {
            console.error(`Error while reading file ${inputPath}: ${error}`);
        }
    } else if (type === 'Directory') {
        try {
            // Zip code for folder here (write from folder / subfolder stream)
            archive.directory(inputPath, path.basename(inputPath));
        } catch (error) {
            console.error(`Error while reading directory ${inputPath}: ${error}`);
        }
    } else {
        console.error(`Error: ${inputPath} is not a supported file type. If you believe this is an error, please submit an issue on the github repo (https://github.com/isak-dombestein/JCompressor)`);
    }    

    // Finalize the archive
    await archive.finalize();

    // Close output stream
    output.close();
}





main();