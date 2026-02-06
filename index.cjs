const fs = require('fs');
const child_process = require('child_process');
const sutils = require('serbinskis-utils');
const Remote = require('serbinskis-utils/remote');

process.on('uncaughtException', (e) => {
    console.log(e);
    if (config.remote) { config.remote.sendOutput(e.stack, false); }
});

var config = {
    ipAddress: process.env.DNS_IP_ADDRESS,
    ipPort: 5000,
    output: true,
    pause: false,
    verbose: false,
}

var remote = {
    title: 'UNO Game' + (process.env.DEBUG ? ' (DEBUG)' : ''),
    priority: -1,
    input: false,
    buttons: [
        {
            id: 'restart',
            command: 'restart',
            title: 'Close',
            enabled: true,
            color: '',
            arguments: { close: true },
            prompts: {},
        },
        {
            id: 'restart',
            command: 'restart',
            title: 'Restart',
            enabled: true,
            color: '',
            arguments: {},
            prompts: {},
        },
        {
            id: 'restart',
            command: 'restart',
            title: 'Update (modules)',
            enabled: true,
            color: '',
            arguments: { update: true },
            prompts: {},
        },
        {
            id: 'restart',
            command: 'restart',
            title: 'Rebuild (application)',
            enabled: true,
            color: '',
            arguments: { rebuild: true },
            prompts: {},
        },
        {
            id: 'pause',
            command: 'pause',
            title: 'Pause',
            enabled: true,
            color: '',
            arguments: {},
            prompts: {},
        },
    ],
}

process.title = remote.title;
config.remote = new Remote(remote, config.ipAddress, config.ipPort, config.output);


(async () => {
    while (!await sutils.isOnline()) { await sutils.Wait(1000); }
    await config.remote.connect({ wait: false });

    //Handle button press
    config.remote.on('press_button', async (button, payload) => {
        var i = remote.buttons.findIndex(e => e.id == button.id);

        if (button.command == 'restart') {
            var j = remote.buttons.findIndex(e => e.id == 'pause');
            config.pause = false;
            remote.buttons[j].title = 'Pause';
            remote.buttons[j].color = '#7289DA';
            config.remote.sendInfo();

            if (payload?.close) { config.close = payload.close; }
            if (payload?.update) { config.update = payload.update; }
            if (payload?.rebuild) { config.rebuild = payload.rebuild; }
            if (config.childProccess) { config.childProccess.send({ command: 'SIGINT' }); }
        }

        if (button.command == 'pause') {
            config.pause = !config.pause;
            remote.buttons[i].title = config.pause ? 'Unpause' : 'Pause';
            remote.buttons[i].color = config.pause ? '#43B581' : '#7289DA';
            config.remote.sendInfo();
            if (config.pause && config.childProccess) { config.childProccess.send({ command: 'SIGINT' }); }
        }
    });

    if (!fs.existsSync('dist')) {
        config.remote.sendOutput('Building application...\n', false);
        await sutils.spawnSync('npm.cmd run build', { shell: true });
    }

    startProccess('index.js');
})();


function startProccess(executable) {
    process.chdir('dist');
    config.remote.sendOutput('\n'.repeat(100), false);
    config.childProccess = child_process.fork(executable, { silent: true });

    //When application exits
    config.childProccess.on('close', async () => {
        process.chdir('..');
        config.childProccess = null;
        config.remote.sendOutput('Application closed.\n', false);

        if (config.close) { return process.exit(); }
        config.remote.sendOutput('Waiting for 5 seconds!\n', false);
        await sutils.Wait(5000);

        while (!await sutils.isOnline()) { await sutils.Wait(1000); }
        if (config.update || config.rebuild || config.pause) { config.remote.clearOutput(); }

        if (config.pause) { config.remote.sendOutput('Application is paused.\n', false); }
        while (config.pause) { await sutils.Wait(1000); }

        if (config.update) {
            config.update = false;
            config.remote.sendOutput('Installing node modules...\n', false);
            fs.unlinkSync('package-lock.json');
            await sutils.rmSync('node_modules', { recursive: true });
            await sutils.spawnSync('npm.cmd install', { shell: true });
        }

        if (config.update || config.rebuild) {
            config.rebuild = false;
            config.remote.sendOutput('Building application...\n', false);
            await sutils.rmSync('dist', { recursive: true });
            await sutils.spawnSync('npm.cmd run build', { shell: true });
        }

        process.title = remote.title;
        startProccess(executable);
    });

    //Output data to console and remote console
    config.childProccess.stdout.on('data', (data) => {
        config.remote.sendOutput(data, false);
    });

    //Output errors to console and remote console
    config.childProccess.stderr.on('data', (data) => {
        config.remote.sendOutput(data, false);
    });
}