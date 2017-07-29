'use strict';

const request = require('request-promise-native');
const readlineSync = require('readline-sync');
const ora = require('ora');
const chalk = require('chalk');
const log = console.log;
const postsList = [];
let spinner;
let topic;
const clearScreen = () => process.stdout.write('\x1Bc');
const options = {
    headers:{
        accept: 'application/json'
    }
}

const readSomeStories = async (searchWord)=>{
    spinner = ora('Getting best stories about ' + chalk.greenBright(topic)).start();
    clearScreen();
    const dirtyResponse = await request(`https://medium.com/search?q=${searchWord}`, options);
    const stringCleanResponse = dirtyResponse.split('])}while(1);</x>')[1];
    const { success, payload  } = JSON.parse(stringCleanResponse)
    if (success){
        const posts = payload.references.Post;
        let order = 1
        spinner.succeed('Nice read !')
        for(let id in posts){
          postsList.push(posts[id].id);
          log(chalk.yellowBright('[' + order + '] ' ) + posts[id].title + ' - ' + chalk.cyanBright(Math.round(posts[id].virtuals.readingTime) + 'min') + ' - ' + chalk.redBright('♥' + posts[id].virtuals.recommends))
          order++;
        }
      const postId = readlineSync.question('Pick one: ');
      getPostById(postsList[postId - 1]);
    }
}

const getPostById = async (postId) =>{
  const dirtyResponse = await request(`https://api.medium.com/_/api/posts/${postId}`);
  const stringCleanResponse = dirtyResponse.split('])}while(1);</x>')[1];
  const { success, payload  } = JSON.parse(stringCleanResponse)
  if (success){
      const content = payload.value.content.bodyModel.paragraphs;
      const onlyText = content.map(text=>text).filter(text=> text.type === 1)
      for(let id in content)
        print(content[id].text, content[id].type);
      const postId = readlineSync.question(chalk.greenBright('The end, Hit any key to get back ...'));
      readSomeStories(topic);
  }
}


const start = ()=>{
  clearScreen();
  topic = readlineSync.question('About what you gonna read today ?');
  readSomeStories(topic);
}

const print = (msg, type) => {
  switch (type){
    case 3:
      log();
      log(chalk.yellowBright('‣ ' + msg));
      break;
    case 1:
      log(msg);
      break;
    case 9:
      log(chalk.redBright(' • ') + msg)
      log();
      break;
  }
}
exports.start = start;