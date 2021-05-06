let Renderer = function() {
    this.root = document.createElement('div');
    this.listener = undefined;

    this.registerListener = function(listener) { this.listener = listener; }

    this.listenAvailable = function() { return this.listener != null && this.listener != undefined; }

    this.render = function(folderTree) {
        return this.renderNode(folderTree.root);
    }

    this.renderNode = function(node) {
        if (node.isDirectory()) {
            return this.renderFolder(node);
        } else {
            return this.renderFile(node);
        }
    }

    this.renderFile = function(node) {
        /**
         *  Each node structure: 
         *      name: string
         *      content: string
         *      children: list
         *      isOpened: if this file is opened
         *      isDirectory: false
         */
        let fileContainer = document.createElement('div');
        fileContainer.setAttribute('id', node.getFullName());
        // TODO: sets style for fileContainer
        // 1. set color & background based on if it is opened
        // 2. set fonts
        
        let nameContainer = document.createElement("h3");
        nameContainer.innerHTML = node.name;
        fileContainer.append(nameContainer);

        let contentContainer = document.createElement('p');
        contentContainer.innerHTML = node.content;
        fileContainer.append(contentContainer);

        node.renderClose = function() {
            fileContainer.style.backgroundColor = 'grey';
        }
        
        node.renderOpen = function() {
            fileContainer.style.backgroundColor = 'blue';
        }

        node.render = function() {
            if (node.isOpen()) {
                node.renderOpen();
            } else {
                node.renderClose();
            }
        }

        node.render();
        
        // should not have children since this is a file
        return fileContainer;
    }

    this.renderFolder = function(node) {
        let folderContainer = document.createElement('div');
        folderContainer.setAttribute('id', node.getFullName());
        folderContainer.style.borderLeft = "1px solid grey";
        
        let nameContainer = document.createElement('h3');
        nameContainer.innerHTML = node.name;
        folderContainer.append(nameContainer);

        let contentContainer = document.createElement('p');
        contentContainer.innerHTML = node.content;
        folderContainer.append(contentContainer);

        if (node.isOpen()) {

            nameContainer.style.color = "red";

            let childrenContainer = document.createElement('div');
            childrenContainer.style.marginLeft = "5px";
            let item;
            if (node.children.length == 0)  {
                item = document.createElement('p');
                item.innerHTML = "this folder has no children;"
                childrenContainer.append(item);
            } else {
                for (item in node.children) {
                    childrenContainer.append(this.renderNode(node.children[item]));
                }
            }
            folderContainer.append(childrenContainer);
        }

        if (this.listenAvailable()) {
            nameContainer.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.listener.listenFolderClick(node);
                if (node.isOpen()) {
                    nameContainer.style.color = 'red';
                } else {
                    nameContainer.style.color = 'blue';
                }
            })
        }
        return folderContainer;
    }
}

export default Renderer;