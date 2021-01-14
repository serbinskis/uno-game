/**
 * Upload local pictures files to imgbb API and get display URLs in response.
 *
 * @param {string} apiKey - Your imgBB API key
 * @param {string} pathToFile - Absolute path to your file
 * @returns {Promise.<ResponseObject>}
 *    A promise. Access your data using `.then` as shown in [the README](https://github.com/TheRealBarenziah/imgbb-uploader#use) :
 * @example
 *     imgbbUploader("your-api-key", "/absolute/path/to/file.jpg")
 *       .then(res => console.log(res))
 *       .catch(err => console.error(err))
 */
interface IOptions {
    apiKey: string;
    imagePath: string;
    name: string | undefined;
    expiration: number | undefined;
}
declare const imgbbUploader: (...args: string[] | IOptions[]) => Promise<import("./responseInterface").default>;
export = imgbbUploader;
