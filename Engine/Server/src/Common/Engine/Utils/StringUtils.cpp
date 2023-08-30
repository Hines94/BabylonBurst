
#include "StringUtils.h"
#include <stdexcept>
#include <string_view>
#include <vector>
#include <zlib.h>

std::string StringUtils::DeflateStringView(std::string_view input) {
    z_stream deflateStream = {};
    deflateStream.zalloc = Z_NULL;
    deflateStream.zfree = Z_NULL;
    deflateStream.opaque = Z_NULL;

    // Initialize the deflate
    if (deflateInit(&deflateStream, Z_DEFAULT_COMPRESSION) != Z_OK) {
        throw std::runtime_error("Failed to initialize deflate");
    }

    // Copy string_view data to a non-const string to avoid const issues with zlib
    std::string nonConstInput(input);

    // Set the input data
    deflateStream.avail_in = static_cast<uInt>(nonConstInput.size());
    deflateStream.next_in = reinterpret_cast<Bytef*>(nonConstInput.data());

    // Prepare output buffer
    std::string output;
    const size_t chunkSize = 1024;
    uint8_t out[chunkSize];

    // Deflate the input string view
    do {
        deflateStream.avail_out = chunkSize;
        deflateStream.next_out = out;

        if (deflate(&deflateStream, Z_FINISH) == Z_STREAM_ERROR) {
            deflateEnd(&deflateStream);
            throw std::runtime_error("Failed to deflate");
        }

        // Append the data to the output string
        size_t have = chunkSize - deflateStream.avail_out;
        output.append(reinterpret_cast<char*>(out), have);

    } while (deflateStream.avail_out == 0);

    // Clean up
    deflateEnd(&deflateStream);

    return output;
}

std::string StringUtils::RemoveNumericPrefix(const std::string& str) {
    size_t i = 0;
    while (i < str.size() && isdigit(str[i])) {
        ++i;
    }
    return str.substr(i);
}

std::string StringUtils::EnsureZipExtension(const std::string& filename) {
    if (filename.size() < 4 || filename.substr(filename.size() - 4) != ".zip") {
        return filename + ".zip";
    }
    return filename;
}