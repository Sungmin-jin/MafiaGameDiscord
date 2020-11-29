const Discord = require('discord.js');
const {MessageEmbed } = require('discord.js');
const client = new Discord.Client();
const token = 'Nzc1MDY3MTUwODcxNDI5MTMw.X6g7iA.4yvsmPDQcyaVxnUwUuZBsXu_29c';
const postfix = "mafia";
const maximumMembers = 15;
const minimumMembers = 6;

//joined member
let members = [];

//survived member
let survivedMembers = [];

//list of maifas
let mafias = [];

//list of citizens
let citizens = [];

//doctor
let doctor = null;

//cop
let cop = null;

//tell game is on or not
let gameon = false;

//tell vote is possible or not
let canvote = false;

//tell secrete vote is possible or not
let secretevote = false;

//a person mafia chosen to kill
let victim = null;

//a person doctor chosen to save
let patient = null;

//tell cop checked or not
let copcheck = false;

//id of the channel
const channelID = '775076043102224434';

client.on('ready', () => {
  console.log("it's on.");
});



client.on('message', (message) => {  

  //create the game
  if(message.content.toLowerCase().trim() === 'create' + postfix) {

    if(members.length != 0) {
      message.reply("game is already created");
    } else {
      members.push(message.author);
      printMembers(message, members);
    }
  }


  //join the game
  else if(message.content.toLowerCase().trim() === 'join' + postfix) {
    if(members.length === 0) {
      message.channel.send("game is not created");
      return;
    }
    if(gameon) {
      message.channel.send("game is already started")
      return;
    }

    var joined = false
    members.forEach((author)=> {
      if(author.id === message.author.id){
        message.reply("you have already joined");
        joined = true;
        return;
      }
    })


    if(!joined) {
      members.push(message.author);
      message.reply("Your are in");
      printMembers(message, members);
    }
  }



  //exit the game
  else if(message.content.toLowerCase().trim() === 'exit' + postfix) {

    if(members.length === 0) {
      message.channel.send("game is not created");
      return;
    }

    let newMembers = members.filter(member=>member.id!==message.author.id);

    if(newMembers.length === members.length){
      message.channel.send("You have never joined.")
      return;
    }

    message.reply("You are out!")
    members = newMembers;

    if(newMembers.length === 0){
      message.channel.send("There is no member in the game. The game is terminated");
      return;
    }

    printMembers(message, members);
  }


  //start the game
  else if(message.content.toLowerCase().trim() === 'start' + postfix) {
    if(gameon) {
      message.channel.send("Game is already started");
      return;
    }
    if(members.length === 0) {
      message.channel.send("game is not created");
      return;
    }

    if(members.length < minimumMembers) {
      message.reply("To start the game, we need at least 6 people");
      message.channel.send("We currently have only " + members.length + " members");
      return;
    }

    let arr = [];

    while(mafias.length != 2) {
      let index = Math.floor(Math.random() * members.length);
      if(arr.indexOf(index) === -1) {
        arr.push(index);
        mafias.push(members[index]);
      }
    }

    while(!doctor) {
      let index = Math.floor(Math.random() * members.length);
      if(arr.indexOf(index) === -1){
        arr.push(index);
        doctor = members[index];
      }
    }

    while(!cop) {
      let index = Math.floor(Math.random() * members.length);
      if(arr.indexOf(index) === -1) {
        arr.push(index);
        cop = members[index];
      }
    }

    citizens = members.filter((member) => {
      if(member.id == mafias[0].id || member.id == mafias[1].id || member.id == doctor.id || member.id == cop.id) {
        return false;
      }
      return true;
    })

    // mafias.forEach((mafia)=> {
    //   mafia.send("you are a mafia");
    // })
    mafias[0].send("you are a mafia, and your partner is " + mafias[1].username);
    mafias[1].send("you are a mafia, and your partner is " + mafias[0].username);
    

    doctor.send("you are a doctor");
    cop.send("you are a cop");


    citizens.forEach((citizen)=>{
      client.users.cache.get(citizen.id).send("You are a citizen");
    })


    let msg = "Game Start!\njoined members:\n";
    members.forEach((member)=> {
      msg += "-" + member.username + "\n";
    })

    survivedMembers = members;

    message.channel.send(msg);
    canvote = true;
    gameon = true;
  }


  else if(message.content.toLowerCase().trim() === 'members' + postfix){
    printMembers(message, members);
  }


  else if(message.content.toLowerCase().trim() === 'survivedmembers'+postfix) {
    if(!gameon) {
      message.channel.send("game has not started yet");
      return;
    }
    let msg = 'survived members:\n';
    survivedMembers.forEach((member)=> {
      msg+= member.username;
    })
    message.channel.send(msg);
  }


  else if(message.content.toLowerCase().trim() === 'vote' + postfix) {
    if(!gameon) {
      message.channel.send("game has not started yet");
      return;
    }

    if(!canvote) {
        message.channel.send("cannot vote now");
        return;
    }
    canvote =false;

    message.channel.send("vote to the most suspected person\n list:\n");
    let msg = '';
    let counter = 1;
    survivedMembers.forEach((member)=> {
      msg += counter + '. ' + member.username +"\n";
      counter++;
    })

    //who got voted
    let votedMember = [];

    //who already vote already
    let votedone = [];

    message.channel.send(msg);
    let filter = m => {
      if(m.author.bot){
        return false;
      }

      if(!survivedMembers.includes(m.author)) {
        m.channel.send("you cannot vote");
        return false;
      }
      else if(votedone.includes(m.author)) {
        m.channel.send("you already voted");
        return false;
      }
      else if(isNumeric(m.content) && Number.isInteger(Number(m.content))){
        if(m.content > survivedMembers.length || m.content < 0) {
          m.channel.send("invalid");
          return false;
        }
        return true;
      }
      return false;
    }

    let voteCounter = 0;
    let collector = new Discord.MessageCollector(message.channel, filter);

    collector.on('collect', (m, col) => {
      votedone.push(m.author);
      let index = parseInt(m.content) - 1;
      if(votedMember.filter(e => e.id === survivedMembers[index].id).length == 0) {
        let newVoteMember = survivedMembers[index];
        newVoteMember.count = 1;
        votedMember.push(newVoteMember);
        voteCounter++;
      }
      else {
        for(let i = 0; i < votedMember.length; i++) {
          if(votedMember[i].id === survivedMembers[index].id) {
            votedMember[i].count++;
            voteCounter++;
            break;
          }
        }
      }
      if(voteCounter == survivedMembers.length) {
        collector.stop();
      }
      let voteMsg = "\n\n\n\vote stat so far:\n";
      votedMember.forEach((member) => {
        voteMsg += member.username + ": " + member.count +"\n";
      })
      m.channel.send(voteMsg);
    })

    collector.on('end', collected => {
      let isTie = false;
      let max = votedMember[0];
      for(let i = 1; i < votedMember.length; i++) {
        if(max.count == votedMember[i].count) {
          isTie = true;
        } else if (max.count < votedMember[i].count) {
          max = votedMember[i];
          isTie = false;
        }
      }
      if(isTie) {

        message.channel.send("\n\n=============vote result===============\n\nthe vote is even so no one dies");

      } else {
        let resultMsg = max.username + " got the most voted and he dies\n"
        if(mafias.filter(e => e.id === max.id).length === 0) {
          resultMsg += "and unfortunately he is not a mafia";
          if(survivedMembers.length - mafias.length <= mafias.length) {
            client.channels.cache.get(channelID).send("Mafia win the game is over");
            return;
          }
        } else {
          resultMsg += "Congruation! he is a mafia";
          mafias = mafias.filter(e => e.id != max.id);
          if(mafias.length == 0) {
            message.channel.send("all mafias are dead. You win!!!!");
            return;
          }
        }

        survivedMembers = survivedMembers.filter(e => e.id != max.id);
        if(doctor != null && max.id == doctor.id) {
          doctor = null;
        }
        if(cop != null && max.id == cop.id) {
          cop = null;
        }

        resultMsg += "\nsurvived members:\n"
        survivedMembers.forEach((member)=> {
          resultMsg += ' - ' + member.username + "\n"
        })
        message.channel.send(resultMsg);
      }
      let nightMsg = '\n\n\n\n==================================\n\n\n\n\nNight has come\n' +
        'Please one mafia send me a person who to kill\n' +
        'Please doctor send me a person who want to save\n' +
        'Please cop send me a person who to inspect';
      message.channel.send(nightMsg);

      let killMsg = 'Select a person who you want to kill by entering a number\n';
      let saveMsg = 'Select a person who you want to save by entering a number\n';
      let suspectMsg = 'Select a person who you want to suspect by entering a nubmer\n'
      let memberCount = 1;
      survivedMembers.forEach((member)=> {
        if(!mafias.includes(member)) {
          killMsg += memberCount + '. ' +member.username + '\n'
        }
        if(cop != member) {
          suspectMsg += memberCount + '. ' + member.username + '\n';
        }
        saveMsg += memberCount + '. ' + member.username + '\n';
        memberCount++;
      })
      mafias.forEach((mafia)=> {
        mafia.send(killMsg);
      })
      if(doctor != null) {
        doctor.send(saveMsg);
      }
      if(cop != null) {
        cop.send(suspectMsg);
      }
      secretevote = true;
    })
  }

  if(secretevote && (message.author == cop || message.author == doctor || mafias.includes(message.author)) &&
   isNumeric(message.content) && Number.isInteger(Number(message.content))) {
    let index = Number(message.content) - 1;
    if(index < 0 && index > survivedMembers.length - 1) {
      message.author.send("invalid nomination")
      return;
    }

    if(mafias.includes(message.author) && victim === null) {   //mafia
      victim = survivedMembers[index];
      mafias.forEach((member)=> {
        member.send("You mafias nominated " + victim.username)
      })
    } else if(message.author === doctor && patient === null) {  //doctor
      patient = survivedMembers[index];
      doctor.send("You nominated " + patient.username);
    } else {  //cop
      copcheck = true;
      if(mafias.includes(survivedMembers[index])){
        cop.send(survivedMembers[index].username + " is a mafia");
      }
      else {
        cop.send(survivedMembers[index].username + " is not a mafia");
      }
    }
    if((patient != null || doctor == null) && victim != null && (copcheck || cop == null)) {
      copcheck = false;
      if(patient === victim) {
        client.channels.cache.get(channelID).send("Doctor save the person no one dies");
      } else {
        client.channels.cache.get(channelID).send("Mafia successfully killed the citizen " + victim.username);
        survivedMembers = survivedMembers.filter(e => e.id != victim.id);

        if(doctor != null && doctor.id == victim.id) {
          doctor = null;
        }
        if(cop != null && cop.id == victim.id) {
          cop = null;
        }

        if(survivedMembers.length - mafias.length <= mafias.length) {
          client.channels.cache.get(channelID).send("Mafia win the game is over");
          return;
        }
      }
      let msg = 'survived members: \n'
      survivedMembers.forEach((member)=> {
        msg += ' - ' + member.username + '\n'
      })
      client.channels.cache.get(channelID).send(msg);
      patient = null;
      victim = null;
      canvote = true;
      secretevote = false;
    }
  }

});


function isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!
  return !isNaN(str) &&
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function printMembers(message, people) {
  let msg = "Current joined members:\n";
  people.forEach((person)=> {
    msg += "-" + person.username + "\n";
  })
  message.channel.send(msg);
}
client.login(token);

