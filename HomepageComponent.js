Vue.component("editor", {
    props: ["default"],
    template: `
    <div>
    <textarea v-model="content"></textarea>
    <markdown-block :content="content" :ast="reparse(content)"></markdown-block>
    </div>
    `
})