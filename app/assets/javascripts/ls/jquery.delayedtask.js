(function($) {
    // hash that uses task name for the key, the value is the timeoutId
    var tasks = {};
    var freqTasks = {};

    /**
     * delays a task with a given number of ms. The main difference between using this
     * method and the basic javascript setTimeout(), is that a task will only get executed
     * if no request is made for another task with the same name within the specified
     * delay time.
     * @param name task name.
     * @param delay number of ms to wait before task is executed.
     * @param task callback function
     */
    $.delayedTask = function(name, delay, task ) {
        var timeoutId = tasks[name];
        if (timeoutId) {
            //console.log("killing task " + name);
            window.clearTimeout(timeoutId);
        }
        tasks[name] = window.setTimeout(function() {
            delete tasks.name;
            //console.log("calling back for task " + name);
            task.call(this);
        }, delay );
    };

    $.maxFrequencyTask = function(name, maxFrequency, task) {
        var taskData = freqTasks[name];
        var now = (new Date()).getTime();

        if (!taskData || (taskData.lastRun < (now - maxFrequency))) {
            // it's been longer than the maxFrequency time since task was last run.
            runFrequencyTask(name, task);
        } else if (!taskData.timerId) {
            // it was already run recently. If we don't have a task waiting already,
            // schedule one now
            var wait = taskData.lastRun - now + maxFrequency;
            taskData.timerId = window.setTimeout(function() {
                runFrequencyTask(name, task);
            }, wait);
        }
    };

    runFrequencyTask = function(name, task) {
        var taskData = freqTasks[name];
        var now = (new Date()).getTime();
        if (taskData) {
            taskData.lastRun = now;
            taskData.timerId = false;
        } else {
            freqTasks[name] = { lastRun: now };
        }
        task.call();
    }

})(jQuery);
