import ForgeUI, {
	render, useProductContext, useState,
	Avatar, Fragment, Macro, Text, Table, Head, Cell, Row,
} from '@forge/ui';
import api from '@forge/api';
// import { fetch } from '@forge/api';


const App = () => {
  const context = useProductContext();
  const [stats, setComments] = useState(async () => await getTopLiked(context.spaceKey));

  return (
    <Fragment>
      <Text>Workspace statistic</Text>
	  <Table>
	    <Head>
	      <Cell>
	        <Text content="Points" />
	      </Cell>
	      <Cell>
	        <Text content="Teammate" />
	      </Cell>
	    </Head>
	    {stats !== null && stats.length !== 0 && stats.map((item) => (
	      <Row>
	        <Cell>
	          <Text>{item[1]}</Text>
	        </Cell>
	        <Cell>
	          <Avatar accountId={item[0].split(',')[0]} />
	        </Cell>
	      </Row>
	    ))}
	  </Table>
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
      const { accountId, publicName } = author;
      const profilePicturePath = author.profilePicture.path;
      const l = [accountId, publicName, profilePicturePath];

      if (l in statDict) {
        statDict[l] += await fetchContentForLikes(listOfPages[index].id);
      } else {
        statDict[l] = await fetchContentForLikes(listOfPages[index].id);
      }

    } else {
      continue;
    }
  }

  const statArray = Object.keys(statDict).map((key) => [key, statDict[key]]);
  statArray.sort((first, second) => second[1] - first[1]);

  return statArray;
};
