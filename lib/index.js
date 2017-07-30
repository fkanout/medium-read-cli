'use strict';
require('events').EventEmitter.defaultMaxListeners = 100;
const inquirer = require('inquirer');
const request = require('request-promise-native');
const readlineSync = require('readline-sync');
const ora = require('ora');
const chalk = require('chalk');
const stdin = process.openStdin(); 
const log = console.log;
const postsList = [];
const postsListContent =[];
let spinner;
let topic;
let order = 1;
let page = 1;


const readSomeStories = async (searchWord)=>{
  spinner = ora('Getting best stories about ' + chalk.greenBright(topic)).start();
  clearScreen();
  const options = {
    headers:{
        accept: 'application/json'
    }
  } 
  const dirtyResponse = await request(`https://api.medium.com/search?q=${searchWord}`, options);
  const stringCleanResponse = dirtyResponse.split('])}while(1);</x>')[1];
  const { success, payload  } = JSON.parse(stringCleanResponse)
  if (success){
    const posts = payload.references.Post;
    spinner.succeed('Nice read !')
    for(let id in posts){
      postsList.push(posts[id].id);
      postsListContent.push(chalk.yellowBright('[' + order + '] ' ) + posts[id].title + ' - ' + chalk.cyanBright(Math.round(posts[id].virtuals.readingTime) + 'min') + ' - ' + chalk.redBright('♥' + posts[id].virtuals.recommends))
      order++;
    }
    showArticlList(postsListContent);
  }
}

const getMoreArticles = async () =>{
  console.log('More...');
  page ++;
  const dirtyResponse = await request({
    method: 'POST',
    uri: `https://medium.com/search/posts?q=${topic}`,
    headers: {
      'accept': 'application/json',
      'x-xsrf-token': 1
    },
    json: true,
    body: {
      ignoredIds: postsList,
      page,
    }
  });
  const stringCleanResponse = dirtyResponse.split('])}while(1);</x>')[1];
  const { success, payload  } = JSON.parse(stringCleanResponse)
  if (success){
    const posts = payload.value;
    for(let id in posts){
      postsList.push(posts[id].id);
      postsListContent.push(chalk.yellowBright('[' + order + '] ' ) + posts[id].title + ' - ' + chalk.cyanBright(Math.round(posts[id].virtuals.readingTime) + 'min') + ' - ' + chalk.redBright('♥' + posts[id].virtuals.recommends))
      order++;
    }
    showArticlList(postsListContent);
  }
}

const getPostById = (postId) =>{
  request(`https://api.medium.com/_/api/posts/${postsList[postId]}`).then(dirtyResponse=>{
    const stringCleanResponse = dirtyResponse.split('])}while(1);</x>')[1];
    const { success, payload  } = JSON.parse(stringCleanResponse)
    if (success){
      const content = payload.value.content.bodyModel.paragraphs;
      const onlyText = content.map(text=>text).filter(text=> text.type === 1)
      for(let id in content)
        print(content[id].text, content[id].type);
      process.stdin.resume();
      process.stdin.setRawMode(true);
    }
  });
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
      log(chalk.redBright(' ◉ ') + msg)
      log();
      break;
     case 'err':
      log(chalk.redBright(' Sry ') + msg)
      log();
      break;
  }
}

const showArticlList = () =>{
  clearScreen();
  const questions ={
    pageSize: 25,
    name: 'content',
    message: 'Pick one :)',
    type: 'list',
    choices: postsListContent
  }
  const prompt = inquirer.createPromptModule();
  prompt(questions).then(response => getPostById(postsListContent.indexOf(response.content)));
}
const clearScreen = () => process.stdout.write('\x1Bc');


stdin.on('keypress', function (chunk, key) {
  if (key && key.name == 'backspace') { showArticlList(); }
  else if (key && key.name == 'space') { getMoreArticles(); }
  else if (key && key.name == 'escape') { process.exit(); }
});

exports.start = start;