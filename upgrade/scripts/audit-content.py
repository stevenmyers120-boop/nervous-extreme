"""Editorial screening aid, not a substitute for reading the source ladders.
Requires scikit-learn in the development environment; no runtime dependency.
"""
import json, re
from collections import Counter
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'challenge-library.json').read_text());cards=data['challenges']
local=[c for c in cards if c['mode']=='in_person']
words=['Sex','Fuck','Cock','Dick','Penis','Pussy','Vagina','Tits','Boobs','Breasts','Nipples','Arse','Bum','Balls','Underwear','Thong','Naked','Strip','Horny','Turned on','Masturbation','Wank','Oral sex','Blowjob','Anal sex','Orgasm','Pubic hair','Kink','Fetish','Dirty talk']
text=' '.join(s['prompt'] for c in local for s in c['steps'])
stop='name say tell admit reveal state give explain player whether would what want wanted honest non graphic question answer words without yourself your you their them this that been have where whom which does did from with about into after before share chosen choosing choose own actually actual request invitation preference directly privately plainly meaning means feel feels feeling'.split()
pairs=[]
for mode in ['in_person','remote']:
    selected=[c for c in cards if c['mode']==mode]
    # Remove each evidence suffix before combining, to avoid screening shared transport text.
    texts=[' '.join(re.sub(r' Share a (?:photo|short video) .*? via Snapchat\.$','',s['prompt']) for s in c['steps']) for c in selected]
    scores=cosine_similarity(TfidfVectorizer(stop_words=stop).fit_transform(texts))
    for i,c in enumerate(selected):
        for j in range(i+1,len(selected)):
            if scores[i,j]>.6:pairs.append({'mode':mode,'a':c['id'],'b':selected[j]['id'],'titles':[c['title'],selected[j]['title']],'similarity':round(float(scores[i,j]),3)})
report={'libraryVersion':data['libraryVersion'],'concepts':len(local),'contactCards':sum(c['contact'] for c in local),'contactByStage':dict(Counter(c['stage'] for c in local if c['contact'])),'inPersonKinds':dict(Counter(c['kind'] for c in local)),'remoteEvidence':dict(Counter(c['completion'] for c in cards if c['mode']=='remote')),'vocabularyOccurrencesInPersonSteps':{w:len(re.findall(r'\b'+re.escape(w)+r'\b',text,re.I)) for w in words},'similarityMethod':'TF-IDF cosine, common instruction words and evidence suffixes removed','threshold':.6,'candidates':sorted(pairs,key=lambda x:-x['similarity']),'limits':['Vocabulary counts exclude titles and count only in-person prompts, so shared variants are not double-counted.','Recurring themes and contact endpoints are expected; similarity is only a review prompt, not proof of conceptual distinction or escalation.']}
report['editorialReview']=[{'titles':['SEX WORD ON YOUR ARM','FOREARM FILTH'],'decision':'Retained as separate concepts','reason':'One is self-selected adult lettering; the other is a partner-created crude drawing and caption. The shared forearm/material/evidence vocabulary triggered screening.'}]
(root/'similarity-review.json').write_text(json.dumps({'libraryVersion':data['libraryVersion'],'method':report['similarityMethod'],'threshold':.6,'pairs':report['candidates'],'editorialReview':report['editorialReview']},indent=2)+'\n')
(root/'content-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
