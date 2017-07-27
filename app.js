const request = require('request-promise-native');
const readlineSync = require('readline-sync');
const ora = require('ora');
const clc = require('cli-color');
const postsList = [];
let spinner;
let topic;
const options = {
    headers:{
        accept: 'application/json'
    }
}

const readSomeStories = async (searchWord)=>{
    spinner = ora('Getting best stories about ' + clc.greenBright(topic)).start();
    process.stdout.write(clc.erase.screen);
    const dirtyResponse = await request(`https://medium.com/search?q=${searchWord}`, options);
    const stringCleanResponse = dirtyResponse.split('])}while(1);</x>')[1];
    const { success, payload  } = JSON.parse(stringCleanResponse)
    if (success){
        const posts = payload.references.Post;
        let order = 1
        spinner.succeed('Nice read !')
        for(let id in posts){
          postsList.push(posts[id].id);
          console.log(clc.yellowBright('[' + order + '] ' ) + posts[id].title + ' - ' + clc.cyanBright(Math.round(posts[id].virtuals.readingTime) + 'min') + ' - ' + clc.redBright('♥' + posts[id].virtuals.recommends))
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
      for(let id in content){
        if (content[id].type === 3){
          console.log();
          console.log(clc.yellowBright('‣ ' +content[id].text ))
        }
        else if (content[id].type === 1)
          console.log(content[id].text)
        else if (content[id].type === 9){
          console.log(clc.redBright(' • ') + content[id].text)
          console.log();
        }
      }
      console.log();
      const postId = readlineSync.question(clc.greenBright('The end, Hit any key to get back ...'));
      readSomeStories(topic);
  }

}
process.stdout.write(clc.erase.screen);
topic = readlineSync.question('About what you gonna read today ? ');
readSomeStories(topic);


 
// if (process.argv[2]){
//     process.stdout.write(clc.erase.screen);
//     // readSomeStories(process.argv[2])
//     getPostById('8ad3a54f2eb1');
// }else
//     console.log('Enter some to search...')




