/**
 * Create: CreateFile & CreateFolder
 */
Vue.component("create-file", {
    template: `
    <v-btn @click.stop="$emit('create-file-event')" icon><v-icon>mdi-file-plus-outline</v-icon></v-btn>
    `
})

Vue.component("create-folder", {
    template: `
    <v-btn @click.stop="$emit('create-folder-event')" icon></v-btn>
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

/*  mdi-file-plus-outline
    mdi-folder-edit-outline
    mdi-file-edit-outline
    mdi-file-plus-outline
 */