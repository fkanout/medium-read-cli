const request = require('request-promise-native');
var clc = require('cli-color');

const options = {
    headers:{
        accept: 'application/json'
    }
}

const readSomeStories = async (searchWord)=>{
    const dirtyResponse = await request(`https://medium.com/search?q=${searchWord}`, options);
    const stringCleanResponse = dirtyResponse.split('])}while(1);</x>')[1];
    const { success, payload  } = JSON.parse(stringCleanResponse)
    if (success){
        const posts = payload.references.Post;
        let order = 1
        for(let id in posts){
            console.log(clc.yellowBright('[' + order + '] ' ) + posts[id].title + ' - ' + clc.cyanBright(Math.round(posts[id].virtuals.readingTime) + 'min') + ' - ' + clc.redBright('♥' + posts[id].virtuals.recommends))
            order++;
        }
    }
}

if (process.argv[2]){
    process.stdout.write(clc.erase.screen);
    readSomeStories(process.argv[2])
}else
    console.log('Enter some to search...')




