"""Add the isolated upgrade namespace without changing either existing game."""
import copy
import json
from pathlib import Path

directory = Path(__file__).resolve().parents[1]
original = json.loads((directory.parent / 'database.rules.json').read_text())

def replace(value):
    if isinstance(value, dict):
        return {key: replace(child) for key, child in value.items()}
    if isinstance(value, str):
        return (value.replace("'distanceRooms'", "'upgradeRooms'")
                .replace(" && root.child('upgradeRooms').child($room).child('closed').val() === false", '')
                .replace(" && newData.child('closed').val() === false", ''))
    return value

upgrade = replace(copy.deepcopy(original['rules']['distanceRooms']))
room = upgrade['$room']
room.pop('closed')
room['.validate'] = "newData.hasChildren(['hostUid','guestUid','createdAt','expiresAt'])"
root = "root.child('upgradeRooms').child($room)"
member = f"auth != null && ({root}.child('hostUid').val() === auth.uid || {root}.child('guestUid').val() === auth.uid)"
room['.write'] = '(' + room['.write'] + ') || (' + member + ' && !newData.exists())'
room['$other'] = {'.validate': False}
state = room['game']['state']
state['.validate'] += " && newData.child('schema').val() === 1 && newData.hasChild('playingMode')"
state['phase']['.validate'] = "newData.val() === 'setup' || newData.val() === 'playing' || newData.val() === 'winner' || newData.val() === 'finished' || newData.val() === 'exhausted'"
state['schema'] = {'.validate': 'newData.val() === 1'}
state['playingMode'] = {'.validate': "(newData.val() === 'in_person' || newData.val() === 'remote') && (!data.exists() || newData.val() === data.val())"}
state['task']['.validate'] = "newData.isString() && newData.val().length <= 64"
state['used']['$i']['.validate'] = "newData.isString() && newData.val().length > 0 && newData.val().length <= 64"
state['responseType']['.validate'] = "newData.val() === 'live' || newData.val() === 'text' || newData.val() === 'photo' || newData.val() === 'video'"
state['results']['$i']['winner']['.validate'] = "newData.isNumber() && newData.val() >= -1 && newData.val() <= 1 && newData.val() % 1 === 0"
action = room['actions']['$action']
action['id']['.validate'] += " || newData.val() === 'skip'"
action['.write'] = action['.write'].replace("newData.child('id').val() === 'nervous'", "newData.child('id').val() === 'nervous' || newData.child('id').val() === 'skip'")
action['.write'] = action['.write'].replace(root + ".child('game').child('state').child('submitted').val() === true", "(" + root + ".child('game').child('state').child('submitted').val() === true || " + root + ".child('game').child('state').child('responseType').val() === 'live')")
action['.write'] = action['.write'].replace(root + ".child('game').child('state').child('phase').val() === 'winner'", "(" + root + ".child('game').child('state').child('phase').val() === 'winner' || " + root + ".child('game').child('state').child('phase').val() === 'exhausted')")
original['rules']['upgradeRooms'] = upgrade
(directory / 'staging.rules.json').write_text(json.dumps(original, indent=2) + '\n')
(directory / 'staging-only.rules.json').write_text(json.dumps({'rules': {'.read': False, '.write': False, 'upgradeRooms': upgrade}}, indent=2) + '\n')
configuration = {'database': {'rules': 'staging.rules.json'}, 'emulators': {'database': {'port': 9001}, 'ui': {'enabled': False}}, 'singleProjectMode': True}
(directory / 'firebase.staging.json').write_text(json.dumps(configuration, indent=2) + '\n')
