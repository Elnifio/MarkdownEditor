/**
 * Create: CreateFile & CreateFolder
 */
Vue.component("create-file", {
    template: `
    <button @click.stop="$emit('create-file-event')">create file</button>
    `
})

Vue.component("create-folder", {
    template: `
    <button @click.stop="$emit('create-folder-event')">create folder</button>
    `
})

/**
 * Delete: DeleteFile & DeleteFolder
 */
Vue.component("delete-file", {
    template: `
    <button @click.stop="$emit('delete-file-event')">delete file</button>
    `
})

Vue.component("delete-folder", {
    template: `
    <button @click.stop="$emit('delete-folder-event')">delete folder</button>
    `
})