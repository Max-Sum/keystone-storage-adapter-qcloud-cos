# Qcloud COS storage adapter for KeystoneJS

## Usage

Configure the storage adapter:

```js
var storage = new keystone.Storage({
  adapter: require('keystone-storage-adapter-qcloud-cos'),
  cos: {
    secret: 'secretID', // required; defaults to process.env.COS_SECRET_ID
    key: 'secretKey', // required; defaults to process.env.COS_SECRET_KEY
    bucket: 'mybucket', // required; defaults to process.env.COS_BUCKET
    region: 'ap-guangzhou', // optional; defaults to process.env.COS_BUCKET, or if that's not specified, ap-guangzhou
    path: '/profilepics'
  },
  schema: {
    bucket: true, // optional; store the bucket the file was uploaded to in your db
    path: true, // optional; store the path of the file in your db
    url: true, // optional; generate & store a public URL
  },
});
```

Then use it as the storage provider for a File field:

```js
File.add({
  name: { type: String },
  file: { type: Types.File, storage: storage },
});
```

### Options:

The adapter requires an additional `cos` field added to the storage options. It accepts the following values:

- **secret**: *(required)* Qcloud secret ID. Configure your Qcloud credentials in the [API credential management](https://console.cloud.tencent.com/cam/capi).

- **key**: *(required)* Qcloud access secret.

- **bucket**: *(required)* Qckoud bucket to upload files to. Bucket must be created before it can be used. 

- **region**: Qcloud region to connect to. Qcloud buckets are global, but local regions will let you upload and download files faster. Defaults to `'ap-guangzhou'`. Eg, `'ap-guangzhou'`.

- **path**: Storage path inside the bucket. By default uploaded files will be stored in the root of the bucket. You can override this by specifying a base path here. Base path must be absolute, for example '/images/profilepics'.


### Schema

The adapter supports all the standard Keystone file schema fields. It also supports storing the following values per-file:

- **bucket**, **path**: The bucket, and path within the bucket, for the file can be is stored in the database. If these are present when reading or deleting files, they will be used instead of looking at the adapter configuration. The effect of this is that you can have some (eg, old) files in your collection stored in different bucket / different path inside your bucket.

The main use of this is to allow slow data migrations. If you *don't* store these values you can arguably migrate your data more easily - just move it all, then reconfigure and restart your server.


# License

Licensed under the standard MIT license. See [LICENSE](license).
