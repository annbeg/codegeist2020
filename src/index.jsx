import ForgeUI, {
	render, useProductContext, useState,
	Avatar, Fragment, Macro, Text, Table, Head, Cell, Row, ButtonSet, Button, StatusLozenge,
} from '@forge/ui';
import api from '@forge/api';
// import { fetch } from '@forge/api';


const App = () => {
  const context = useProductContext();
  const [activePanel, setActivePanel] = useState('liked');

  const [topLiked, setTopLiked] = useState(async () => await getTopLiked(context.spaceKey));
  const [topContributors, setTopContributors] = useState(async () => await getTopContributors(context.spaceKey));
  const [topCommentators, setTopCommentators] = useState(async () => await getTopCommentators(context.spaceKey));

  return (
    <Fragment>
      <Text>
	  	**Workspace statistic**
	  </Text>
	  <ButtonSet>
		<Button text="Top liked" onClick={() => { setActivePanel('liked'); }} />
		<Button text="Top contributors" onClick={() => { setActivePanel('contributors'); }} />
		<Button text="Top commentators" onClick={() => { setActivePanel('commentators'); }} />
	  </ButtonSet>
	  {activePanel === 'liked' && (
		<Fragment>
		  <Text>
		  	Top liked
		  </Text>
		  <Table>
		    <Head>
			  <Cell>
			    <Text content="Likes" />
			  </Cell>
			  <Cell>
			    <Text content="Teammate" />
			  </Cell>
		    </Head>
		    {topLiked !== null && topLiked.length !== 0 && topLiked.map((item) => (
			  <Row key={item[1]}>
			    <Cell>
			      <Text>{item[1]}</Text>
			    </Cell>
			    <Cell>
				  <Avatar accountId={item[0]} />
			    </Cell>
			  </Row>
		    ))}
		  </Table>
		</Fragment>
	  )}
	  {activePanel === 'contributors' && (
		<Fragment>
  		  <Text>
  		  	Top contributors
  		  </Text>
		  <Table>
		    <Head>
			  <Cell>
			    <Text content="Likes" />
			  </Cell>
			  <Cell>
			    <Text content="Teammate" />
			  </Cell>
		    </Head>
		    {topContributors !== null && topContributors.length !== 0 && topContributors.map((item) => (
			  <Row key={item[1]}>
			    <Cell>
			      <Text>{item[1]}</Text>
			    </Cell>
			    <Cell>
				  <Avatar accountId={item[0]} />
			    </Cell>
			  </Row>
		    ))}
		  </Table>
		</Fragment>
	  )}
	  {activePanel === 'commentators' && (
		<Fragment>
		  <Text>
		  	Top commentators
		  </Text>
		  <Table>
		    <Head>
			  <Cell>
			    <Text content="Likes" />
			  </Cell>
			  <Cell>
			    <Text content="Teammate" />
			  </Cell>
		    </Head>
		    {topCommentators !== null && topCommentators.length !== 0 && topCommentators.map((item) => (
			  <Row key={item[1]}>
			    <Cell>
			      <Text>{item[1]}</Text>
			    </Cell>
			    <Cell>
				  <Avatar accountId={item[0]} />
			    </Cell>
			  </Row>
		    ))}
		  </Table>
		</Fragment>
	  )}
    </Fragment>
  );
};

export const run = render(
  <Macro
	app={<App />}
  />
);

const fetchContentForLikes = async (contentId) => {
  const res = await api
    .asApp()
    .requestConfluence(`/wiki/rest/api/content/${contentId}?expand=metadata.likes`);

  const data = await res.json();

  return data.metadata.likes.count;
};
// => amount of likes

const fetchContentForAuthor = async (contentId) => {
  const res = await api
    .asApp()
    .requestConfluence(`/wiki/rest/api/content/${contentId}/history?expand=contributors.publishers`);
    // .requestConfluence(`/wiki/rest/api/content/${contentId}?expand=metadata.likes`);
    // .requestConfluence(`/wiki/rest/api/space/${contentId}/history?expand=contributors.publishers`);

  const data = await res.json();

  // return data.metadata.likes.count;
  return data.createdBy;
};
// => createdBy properties

const fetchForContentInSpace = async (spaceKey) => {
  const res = await api
    .asApp()
    .requestConfluence(`/wiki/rest/api/content?spaceKey=${spaceKey}`);

  const data = await res.json();

  return data.results;
};
// => [page]

const getTopLiked = async (spaceKey) => {
  const listOfPages = await fetchForContentInSpace(spaceKey);


  const statDict = {};

  for (let index = 0; index < listOfPages.length; index += 1) {
    const author = await fetchContentForAuthor(listOfPages[index].id);
    if (author.type === 'known') {
      const { accountId } = author;
      // const l = [accountId, publicName];

      if (accountId in statDict) {
        statDict[accountId] += await fetchContentForLikes(listOfPages[index].id);
      } else {
        statDict[accountId] = await fetchContentForLikes(listOfPages[index].id);
      }

    } else {
      continue;
    }
  }

  const statArray = Object.keys(statDict).map((key) => [key, statDict[key]]);
  statArray.sort((first, second) => second[1] - first[1]);

  return statArray;
};
// => [[accountId,likes]

const fetchContentForContributors = async (contentId) => {


  const res = await api
    .asApp()
    .requestConfluence(`/wiki/rest/api/content/${contentId}/history?expand=contributors.publishers.users`);
    // .requestConfluence(`/wiki/rest/api/content/${contentId}?expand=metadata.likes`);
    // .requestConfluence(`/wiki/rest/api/space/${contentId}/history?expand=contributors.publishers`);

  const data = await res.json();


  const resultData = [];
  for (var i = 0;i<data.contributors.publishers.users.length;i++){
    if (data.contributors.publishers.users[i].type !== 'anonymous'){
      resultData.push(data.contributors.publishers.users[i].accountId);
    }
  }

  // return data.metadata.likes.count;
  return resultData;
};
// =>[accountId]


const getTopContributors = async (spaceKey) => {
  const listOfPages = await fetchForContentInSpace(spaceKey);

  const statDict = {};

  for (let index = 0; index < listOfPages.length; index += 1) {
    const authors = await fetchContentForContributors(listOfPages[index].id);
    for (let i = 0; i < authors.length; i++){
      if (authors[i] in statDict){
        statDict[authors[i]] += 1
      }else{
        statDict[authors[i]] = 1
      }
    }
  }



  const statArray = Object.keys(statDict).map((key) => [key, statDict[key]]);
  statArray.sort((first, second) => second[1] - first[1]);

  return statArray;
};
// =>[[accountId, contibutionsAmount]]

const fetchContentForCommentsAuthors = async (contentId) => {


  const res = await api
    .asApp()
    .requestConfluence(`/wiki/rest/api/content/${contentId}/descendant/comment?expand=history`);
    // .requestConfluence(`/wiki/rest/api/content/${contentId}/child/comment?expand=body.editor.webresource,body.editor.embeddedContent,body.storage`);
    // .requestConfluence(`/wiki/rest/api/content/${contentId}?expand=metadata.likes`);
    // .requestConfluence(`/wiki/rest/api/space/${contentId}/history?expand=contributors.publishers`);

  const data = await res.json();

  // console.log(data.contributors.publishers.users);
  const resultData = [];

  for (var i=0;i<data.results.length;i++){
    resultData.push(data.results[i].history.createdBy.accountId)
  }


  // console.log(resultData);
  // return data.metadata.likes.count;
  return resultData;
};
// => [accountId]

const getTopCommentators = async (spaceKey) => {
  const listOfPages = await fetchForContentInSpace(spaceKey);

  const statDict = {};

  for (let index = 0; index < listOfPages.length; index += 1) {
    const commentators = await fetchContentForCommentsAuthors(listOfPages[index].id);
    for (let i=0;i<commentators.length;i++){
      if (commentators[i] in statDict){
        statDict[commentators[i]] += 1
      }else{
        statDict[commentators[i]] = 1
      }
    }
  }



  const statArray = Object.keys(statDict).map((key) => [key, statDict[key]]);
  statArray.sort((first, second) => second[1] - first[1]);

  return statArray;
};
// => [[commentator, commentsAmount]]
