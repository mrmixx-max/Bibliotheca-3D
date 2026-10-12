import { BookMetadata, Chapter, ParsedBook } from '../types/epub';
import { paginateChapters } from './epubParser';

export interface SampleBookDef {
  id: string;
  metadata: BookMetadata;
  chapters: Chapter[];
}

export const SAMPLE_BOOKS: SampleBookDef[] = [
  {
    id: 'der-kleine-prinz',
    metadata: {
      title: 'Der Kleine Prinz',
      author: 'Antoine de Saint-Exupéry',
      language: 'de',
      description: 'Man sieht nur mit dem Herzen gut. Das Wesentliche ist für die Augen unsichtbar.',
      coverTexture: 'leather-burgundy',
      coverColor: '#2b1216'
    },
    chapters: [
      {
        id: 'dedication',
        title: 'Widmung an Léon Werth',
        order: 0,
        content: `
          <p>Ich bitte die Kinder um Verzeihung, dass ich dieses Buch einem erwachsenen Menschen widme. Ich habe einen ernsten Grund dafür: dieser erwachsene Mensch ist der beste Freund, den ich auf der Welt habe. Ich habe noch einen zweiten Grund: dieser erwachsene Mensch kann alles verstehen, sogar Bücher für Kinder.</p>
          <p>Ich habe noch einen dritten Grund: er hungert und friert in Frankreich. Er braucht dringend Trost. Wenn alle diese Gründe nicht genügen, will ich dieses Buch dem Kind widmen, das dieser erwachsene Mensch einst war. Alle großen Leute sind einmal Kinder gewesen (aber wenige erinnern sich daran). Ich verbessere also meine Widmung:</p>
          <p>Für Léon Werth, als er noch ein kleiner Junge war.</p>
        `
      },
      {
        id: 'kapitel-1',
        title: 'I. Das Bild der Riesenschlange',
        order: 1,
        content: `
          <p>Als ich sechs Jahre alt war, sah ich einmal in einem Buch über den Urwald, das »Erlebte Geschichten« hieß, ein wunderschönes Bild. Es stellte eine Riesenschlange dar, die ein Raubtier verschlang. Da sagte ich mir: Die Schlangen verschlingen ihre Beute ganz, ohne sie zu kauen. Danach können sie sich nicht mehr rühren und schlafen sechs Monate, um zu verdauen.</p>
          <p>Ich habe damals viel über die Abenteuer des Dschungels nachgedacht und vollendete mit einem Farbstift meine erste Zeichnung. Meine Zeichnung Nummer Eins sah aus wie ein Hut. Aber es war kein Hut. Es war eine Riesenschlange, die einen Elefanten verdaute.</p>
          <p>Ich habe den großen Leuten mein Meisterwerk gezeigt und sie gefragt, ob ihnen meine Zeichnung nicht Angst mache. Sie antworteten mir: »Warum sollte uns ein Hut Angst machen?«</p>
          <p>Da habe ich das Innere der Riesenschlange gezeichnet, damit die großen Leute es verstehen konnten. Sie brauchen ja immer Erklärungen. Meine Zeichnung Nummer Zwei war das Innere der Riesenschlange mit dem Elefanten.</p>
          <p>Die großen Leute rieten mir, die Zeichnungen der offenen oder geschlossenen Riesenschlangen beiseite zu lassen und mich mehr für Geographie, Geschichte, Rechnen und Grammatik zu interessieren. So kam es, dass ich im Alter von sechs Jahren eine glanzvolle Malerlaufbahn aufgab.</p>
        `
      },
      {
        id: 'kapitel-2',
        title: 'II. Die Begegnung in der Wüste',
        order: 2,
        content: `
          <p>So lebte ich allein, ohne jemanden, mit dem ich wirklich hätte sprechen können, bis ich vor sechs Jahren eine Panne in der Wüste Sahara hatte. Etwas an meinem Motor war zerbrochen. Und da ich weder einen Mechaniker noch Passagiere bei mir hatte, machte ich mich ganz allein an die schwierige Reparatur.</p>
          <p>Es war für mich eine Frage von Leben oder Tod. Ich hatte kaum Trinkwasser für acht Tage. Am ersten Abend schlief ich also auf dem Sand ein, tausend Meilen von jeder bewohnten Gegend entfernt. Ich war viel verlassener als ein Schiffbrüchiger auf einem Floß mitten im Ozean.</p>
          <p>Ihr könnt euch daher meine Überraschung vorstellen, als mich bei Sonnenaufgang eine feine, seltsame Stimme weckte. Sie sprach:</p>
          <p>»Bitte... zeichne mir ein Schaf!«</p>
          <p>»Wie bitte?«</p>
          <p>»Zeichne mir ein Schaf...«</p>
          <p>Ich sprang auf die Füße, als wäre der Blitz in mich gefahren. Ich rieb mir gründlich die Augen. Ich schaute aufmerksam umher. Und ich sah ein ganz außergewöhnliches kleines Männchen, das mich mit großem Ernst betrachtete.</p>
        `
      },
      {
        id: 'kapitel-21',
        title: 'XXI. Der Fuchs und das Geheimnis',
        order: 3,
        content: `
          <p>Da erschien der Fuchs.</p>
          <p>»Guten Tag«, sagte der Fuchs.</p>
          <p>»Guten Tag«, antwortete höflich der kleine Prinz, der sich umdrehte, aber nichts sah.</p>
          <p>»Ich bin hier«, sagte die Stimme, »unter dem Apfelbaum.«</p>
          <p>»Wer bist du?«, sagte der kleine Prinz. »Du bist sehr hübsch...«</p>
          <p>»Ich bin ein Fuchs«, sagte der Fuchs.</p>
          <p>»Komm und spiel mit mir«, schlug ihm der kleine Prinz vor. »Ich bin so traurig...«</p>
          <p>»Ich kann nicht mit dir spielen«, sagte der Fuchs. »Ich bin noch nicht gezähmt.«</p>
          <p>»Ah! Verzeihung«, sagte der kleine Prinz. Aber nach einigem Nachdenken fügte er hinzu: »Was bedeutet gezähmt?«</p>
          <p>»Es bedeutet: sich vertraut machen, Bande knüpfen«, sagte der Fuchs. »Für mich bist du nur ein kleiner Junge, der hunderttausend anderen kleinen Jungen völlig gleicht. Aber wenn du mich zähmst, werden wir einander brauchen. Du wirst für mich einzig sein auf der Welt. Ich werde für dich einzig sein auf der Welt...«</p>
          <p>Und als der kleine Prinz Abschied nehmen musste, sagte der Fuchs: »Hier ist mein Geheimnis. Es ist ganz einfach: Man sieht nur mit dem Herzen gut. Das Wesentliche ist für die Augen unsichtbar.«</p>
        `
      }
    ]
  },
  {
    id: 'die-verwandlung',
    metadata: {
      title: 'Die Verwandlung',
      author: 'Franz Kafka',
      language: 'de',
      description: 'Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt.',
      coverTexture: 'leather-dark',
      coverColor: '#1a181b'
    },
    chapters: [
      {
        id: 'kapitel-1',
        title: 'I. Das Erwachen',
        order: 0,
        content: `
          <p>Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch, auf dessen Höhe sich die Bettdecke, zum gänzlichen Niedergleiten bereit, kaum noch erhalten konnte. Seine vielen, im Vergleich zu seinem sonstigen Umfang kläglich dünnen Beine flimmerten ihm hilflos vor den Augen.</p>
          <p>»Was ist mit mir geschehen?«, dachte er. Es war kein Traum. Sein Zimmer, ein richtiges, nur etwas zu kleines Menschenzimmer, lag ruhig zwischen den vier wohlbekannten Wänden. Über dem Tisch, auf dem eine aufgespannte Musterkollektion von Tuchwaren ausgebreitet war – Samsa war Reisender –, hing das Bild, das er vor kurzem aus einer illustrierten Zeitschrift ausgeschnitten und in einen hübschen, vergoldeten Rahmen getan hatte.</p>
          <p>Gregors Blick wandte sich dann zum Fenster, und das trübe Wetter – man hörte Regentropfen auf das Fensterblech aufschlagen – machte ihn ganz melancholisch. »Wie wäre es, wenn ich noch ein wenig weiterschliefe und alle Verrücktheiten vergäße«, dachte er, aber das war gänzlich unausführbar, denn er war gewohnt, auf der rechten Seite zu schlafen, konnte sich aber in seinem gegenwärtigen Zustand nicht in diese Lage bringen.</p>
        `
      },
      {
        id: 'kapitel-2',
        title: 'II. Die Pflicht des Reisenden',
        order: 1,
        content: `
          <p>»Ach Gott«, dachte er, »was für einen anstrengenden Beruf habe ich gewählt! Tagaus, tagein auf der Reise. Die geschäftlichen Aufregungen sind viel größer als im eigentlichen Geschäft zu Hause, und außerdem ist mir noch diese Plage des Reisens auferlegt, die Sorgen um die Zuganschlüsse, das unregelmäßige, schlechte Essen, ein immer wechselnder, nie andauernder, nie herzlich werdender menschlicher Verkehr. Der Teufel soll das alles holen!«</p>
          <p>Er fühlte ein leichtes Jucken oben auf dem Bauche; schob sich auf dem Rücken langsam näher zum Bettpfosten, um den Kopf besser heben zu können; fand die juckende Stelle, die mit lauter kleinen weißen Pünktchen besetzt war, die er nicht zu beurteilen verstand; und wollte mit einem Bein die Stelle betasten, zog es aber gleich zurück, denn bei der Berührung umwehten ihn Kälteschauer.</p>
          <p>Er glitt wieder in seine frühere Lage zurück. »Dies frühzeitige Aufstehen«, dachte er, »macht einen ganz blödsinnig. Der Mensch muss seinen Schlaf haben. Andere Reisende leben wie Paschas.«</p>
        `
      }
    ]
  },
  {
    id: 'alice-wunderland',
    metadata: {
      title: 'Alice im Wunderland',
      author: 'Lewis Carroll',
      language: 'de',
      description: 'Ein Abenteuer durch den Kaninchenbau in eine Welt voller Wunder und verrückter Teegesellschaften.',
      coverTexture: 'leather-forest',
      coverColor: '#122319'
    },
    chapters: [
      {
        id: 'kapitel-1',
        title: 'I. Hinab in den Kaninchenbau',
        order: 0,
        content: `
          <p>Alice fing an sich zu langweilen; sie saß schon lange bei ihrer Schwester am Ufer und hatte nichts zu tun. Ein- oder zweimal hatte sie in das Buch geguckt, das ihre Schwester las, aber es waren weder Bilder noch Gespräche darin, »und was nützt ein Buch«, dachte Alice, »ohne Bilder oder Gespräche?«</p>
          <p>Sie überlegte sich eben, so gut es bei der Hitze ging, die sie ganz schläfrig und dumm machte, ob die Lust, eine Gänseblümchenkette zu flechten, die Mühe wert sei aufzustehen und die Gänseblümchen zu pflücken, als plötzlich ein weißes Kaninchen mit rosa Augen dicht an ihr vorbeirannte.</p>
          <p>Das war nun zwar nicht so sehr merkwürdig; Alice fand es auch nicht gar zu außerordentlich, dass sie das Kaninchen vor sich hinmurmeln hörte: »O weh, o weh! Ich werde zu spät kommen!« (als sie später darüber nachdachte, fiel ihr ein, dass sie sich darüber hätte wundern sollen, aber damals kam ihr alles ganz natürlich vor). Als aber das Kaninchen tatsächlich eine Uhr aus der Westentasche zog, darauf blickte und eilig weiterlief, sprang Alice auf, denn es blitzte ihr durch den Kopf, dass sie noch nie ein Kaninchen mit einer Westentasche und einer Uhr darin gesehen hatte.</p>
          <p>Von Neugierde getrieben, rannte sie ihm über das Feld nach und kam gerade noch zur rechten Zeit, um zu sehen, wie es in ein großes Kaninchenloch unter der Hecke schlüpfte. Im nächsten Augenblick war Alice hinterdrein, ohne auch nur einen Moment darüber nachzudenken, wie in aller Welt sie je wieder herauskommen sollte.</p>
        `
      },
      {
        id: 'kapitel-2',
        title: 'II. Der Tränenteich',
        order: 1,
        content: `
          <p>»Kurioser und kurioser!«, rief Alice (sie war so überrascht, dass sie für den Augenblick ganz vergaß, wie man gutes Deutsch spricht). »Jetzt ziehe ich mich auseinander wie das größte Teleskop, das es je gab! Auf Wiedersehen, meine Füße!« (denn als sie auf ihre Füße hinabblickte, schienen sie beinahe außer Sicht zu sein, so weit weg waren sie).</p>
          <p>»O meine armen Füßchen, wer wird euch jetzt bloß Schuhe und Strümpfe anziehen? Denn ich kann es gewiss nicht mehr! Ich bin viel zu weit weg, um mich um euch zu kümmern; ihr müsst sehen, wie ihr zurechtkommt! Aber ich muss artig zu ihnen sein«, dachte Alice, »sonst gehen sie vielleicht nicht den Weg, den ich gehen möchte!«</p>
          <p>Und so plante sie, wie sie ihren Füßen jedes Weihnachten ein hübsches neues Paar Stiefel schicken wolle.</p>
        `
      }
    ]
  },
  {
    id: 'sherlock-holmes',
    metadata: {
      title: 'Ein Skandal in Böhmen',
      author: 'Arthur Conan Doyle',
      language: 'de',
      description: 'Für Sherlock Holmes ist sie immer nur DIE Frau gewesen. Irene Adler von zweifelhaftem Ruf und makellosem Verstand.',
      coverTexture: 'leather-navy',
      coverColor: '#0e1726'
    },
    chapters: [
      {
        id: 'kapitel-1',
        title: 'I. Für Sherlock Holmes ist sie DIE Frau',
        order: 0,
        content: `
          <p>Für Sherlock Holmes ist sie immer nur DIE Frau gewesen. Ich habe ihn selten unter einem anderen Namen von ihr sprechen hören. In seinen Augen stellte sie das ganze Geschlecht in den Schatten. Nicht etwa, dass er für Irene Adler ein Gefühl gehegt hätte, das der Liebe ähnlich gewesen wäre.</p>
          <p>Alle Empfindungen, und diese im besonderen, waren seinem kühlen, präzisen, aber bewundernswert ausgeglichenen Geiste zuwider. Er war, meiner Überzeugung nach, die vollkommenste Denk- und Beobachtungsmaschine, die die Welt je gesehen hat; aber als Liebhaber hätte er sich unmöglich machen müssen.</p>
          <p>Ich hatte Holmes einige Zeit nicht gesehen. Meine Heirat hatte uns einander entfremdet. Mein eigenes vollkommenes Glück und die häuslichen Interessen, die sich um den Mann sammeln, der sich zum ersten Male Herr seines eigenen Herdes findet, nahmen mich ganz in Anspruch, während Holmes, der jede gesellschaftliche Form mit seiner ganzen böhmischen Seele verabscheute, in unserer Wohnung in der Baker Street verblieb.</p>
          <p>Eines Abends – es war am zwanzigsten März 1888 – kehrte ich von einem Patientenbesuch zurück, denn ich hatte meine ärztliche Praxis wieder aufgenommen. Mein Weg führte mich durch die Baker Street. Als ich an der wohlbekannten Tür vorüberging, überkam mich der dringende Wunsch, Holmes wiederzusehen und zu erfahren, wie er seine außerordentlichen Kräfte gebrauchte.</p>
        `
      }
    ]
  }
];

export function getParsedSampleBook(bookId: string): ParsedBook {
  const sample = SAMPLE_BOOKS.find(b => b.id === bookId) || SAMPLE_BOOKS[0];
  const pages = paginateChapters(sample.chapters, sample.metadata);
  return {
    metadata: sample.metadata,
    chapters: sample.chapters,
    pages
  };
}
