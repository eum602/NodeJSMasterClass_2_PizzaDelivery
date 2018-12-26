/**
 * Library for storing and  rotating logs
 */
const fs = require('fs')
const path = require('path')

const zlib =require('zlib')

//Container for the module
const lib = {}


// Base directory of logs folder
lib.baseDir = path.join(__dirname,'/../.logs/');

//Append a string to a file. Create a file if it does not exist
lib.append = (file, str , callback) =>{
    //Openind the file for appending
    fs.open(lib.baseDir + file + '.log' , 'a',(err,fileDescriptor)=>{//"a" stands for appending
        if(!err && fileDescriptor){
            fs.appendFile(fileDescriptor,str + '\n',err=>{
                if(!err){
                    fs.close(fileDescriptor,err=>{
                        if(!err){
                            callback(false)
                        }else{
                            callback('Error closing file that was being appended')
                        }
                    })
                }else{
                    callback('Error appending to file')
                }
            })
        }else{
            callback('Could not open file for appending')
        }
    }) 
}

//list all the logs and optionally  include the compressed box
lib.list = (includeCompressedLogs,callback)=>{
    fs.readdir(lib.baseDir,(err,data)=>{
        if(!err && data && data.length>0){
            const trimmedFileNames = []
            data.forEach(fileName=>{
                //Add the.logFiles
                if(fileName.indexOf('.log')>-1){
                    trimmedFileNames.push(fileName.replace('.log',''))
                }
                //Add on the .gz files (add on the compressed files,we are doing a zlib compression
                //that normally makes things normally in .gz but as we are going to read them later so we are
                // going to encode that in base 64 in order to read that easily)
                if(fileName.indexOf('.gz.b64')>-1 && includeCompressedLogs){
                    trimmedFileNames.push(fileName.replace('.gz.b64',''))
                }
            })
            callback(false,trimmedFileNames)//false because no errors
        }else{
            callback(err,data)
        }
    })
}

//Compress the contents of one .log file into a .gz.b64
//file  within the same directory
lib.compress = (logId,newFileId,callback)=>{
    const sourceFile =logId + '.log'
    const destFile = newFileId + '.gz.b64'

    //Read the source file
    //utf8 means we want to read it in utf8 encoding
    //sourceFile =>name of the file
    fs.readFile(lib.baseDir + sourceFile,'utf8',(err,inputString)=>{
        if(!err && inputString){
            //compress the data using gzip
            zlib.gzip(inputString,(err,buffer)=>{//the buffer is gonna contain the compressed data
                if(!err && buffer){
                    //Send the compressed data to the destination file
                    fs.open(lib.baseDir + destFile , 'wx' , (err,fileDescriptor)=>{
                        if(!err && fileDescriptor){
                            //write to the destination file
                            //.tostring method is a built in method of buffer that takes that buffer and 
                            //become in for example base64 encoded string so it can be written in a file
                            fs.writeFile(fileDescriptor,buffer.toString('base64'),err=>{
                                if(!err){
                                    //close the destination file
                                    fs.close(fileDescriptor,err=>{
                                        if(!err){
                                            callback(false)
                                        }else{
                                            callback(err)
                                        }
                                    })
                                }else{
                                    callback(err)
                                }
                            })
                        }else{
                            callback(err)
                        }
                    })
                }else{
                    callback(err)
                }
            })
        }else{
            callback(err)
        }
    })
}

//Decompress the contents  of a .gz.b64 file into a string variable
lib.decompress = (fileId,callback)=>{
    const fileName = fileId + '.gz.b64'
    fs.readFile(lib.baseDir + fileName,'utf8',(err,str)=>{//reading in utf8
        if(!err && str){
            //decompress the data
            const inputBuffer = Buffer.from(str,'base64')//create a new bufer out of the inputs indicated
            zlib.unzip(inputBuffer,(err,outputBuffer)=>{
                if(!err && outputBuffer){
                    //Callback
                    const str = outputBuffer.toString()
                    callback(false,str)
                }else{
                    callback(err)
                }
            })
        }else{
            callback(err)
        }

    })
}

//Truncate a log file
lib.truncate= (logId,callback)=>{
    fs.truncate(lib.baseDir + logId + '.log',0,err=>{
        if(!err){
            callback(false)
        }else{
            callback(err)
        }
    })
}
//Export the module
module.exports = lib