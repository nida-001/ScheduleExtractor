/**
 * This is the main function
 */
function processInbox() {
  var MAX_RETRIEVE_MAILS = 30;
  Logger.log("start processInbox")
  // get all threads in inbox
  // var threads = GmailApp.getInboxThreads();
  var threads = GmailApp.getInboxThreads(0, MAX_RETRIEVE_MAILS);
  var my_calendar = getCalendar();
  
  Logger.log(my_calendar);
  
  for (var i = 0; i < threads.length; i++) {
    if (isTargetThread(threads[i])) {
      // get all messages in a given thread
      var messages = threads[i].getMessages();
      // iterate over each message
      for (var j = 0; j < messages.length; j++) {
        // log message subject
        // Logger.log(messages[j].getSubject());
        try {
          var mailBody = messages[j].getPlainBody();
          var schedule = extractSchedule(messages[j]);
          Logger.log('schedule=' + schedule);
          if (schedule != null) {
            addScheduleToCalendar(my_calendar, schedule);
          }
        } catch (e) {
          Logger.log(e);
        }
      }
    }
  }
};

function isTargetThread(thread) {
  return (thread.isImportant() || thread.hasStarredMessages());
}

function getCalendar() {
  var my_calendar = CalendarApp.getAllOwnedCalendars()[0];
  return my_calendar;
}

/**
 * get date string
 * return { title(String), startTime(Date), endTime(Date), option { description(String) <- assign mail Id }
 * if not found, return null
 */
function extractSchedule(message) {

  var ret = { 'title' : message.getSubject() };
  var mailUrlBase = 'https://mail.google.com/mail/u/0/?hl=ja&pli=1#inbox/';
  var opt = { 'description' : (mailUrlBase + message.getId()) };
  ret['options'] = opt;
  
  var jaDate = /(\d+)月(\d+)日/;
  var jaOnlyDate = /(\d+)日/;

  var mailBody = message.getPlainBody();
  var mailDate = message.getDate();
  var result = jaDate.exec(mailBody);
  var currentYear = mailDate.getYear();
 
  
  if (result != null) {
    ret['startTime'] = new Date(currentYear, result[1]-1, result[2]);
    return ret;
  } else {
    result = jaOnlyDate.exec(mailBody);
    if (result != null) {
      var month = mailDate.getMonth();
      ret['startTime'] = new Date(currentYear, month, result[1]);
      return ret;
    }
  }
  return null;
}

/**
 *
 */
function addScheduleToCalendar(my_calendar, schedule) {
  Logger.log('addScheduleToCalander:' + my_calendar + ', ' + schedule);
  
  // check already added schedule
  if (existsEvent(my_calendar, schedule)) { 
    Logger.log('the event already exists');
    return ; 
  }
  
  if (schedule.endTime != null) {
    Logger.log('Unimplemented');
  } else {
    Logger.log('All day event');
    my_calendar.createAllDayEvent(schedule.title, schedule.startTime, schedule.options);
    Logger.log('Success to create Event'); 
  }
}


function existsEvent(my_calendar, schedule) {
  var events = my_calendar.getEventsForDay(schedule.startTime);
  for (var i = 0; i < events.length; i++) {
    var desc = events[i].getDescription();
    if (desc.indexOf(schedule.options.description) > -1) {
      return true;
    }
  }
  return false;
}